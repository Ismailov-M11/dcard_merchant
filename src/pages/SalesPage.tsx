import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, Pencil } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { fetchMerchantDeals, createDeal, updateDeal, updateDealStatus } from '@/api/deals';
import { fetchPartners } from '@/api/outlets';
import { fetchSubscriptionPlans } from '@/api/plans';
import type { MerchantDeal, DealStatus, Partner, SubscriptionPlanSummary } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { SaleTypeBadge } from '@/components/SaleTypeBadge';
import { MoneyText } from '@/components/MoneyText';
import { ErrorState } from '@/components/ErrorState';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fmtDate } from '@/lib/dates';
import { mediaUrl } from '@/lib/assets';

const dealSchema = z.object({
  partner_id: z.string().min(1),
  subscription_plan: z.string().min(1, 'Выберите план'),
  offer_type: z.string().min(1, 'Выберите тип'),
  price: z.string().optional(),
  discount_percent: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  title_uz: z.string().optional(),
  title_ru: z.string().optional(),
  description_uz: z.string().optional(),
  description_ru: z.string().optional(),
});
type DealFormValues = z.infer<typeof dealSchema>;

const ALL_OFFER_TYPES = [
  { value: 'discount', label: 'Скидка' },
  { value: 'one_plus_one', label: '1+1' },
  { value: 'exclusive', label: 'Эксклюзив' },
];

const STATUS_OPTS: { value: DealStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'На проверке' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'Приостановленные' },
  { value: 'rejected', label: 'Отклонённые' },
];

function StatusSwitch({ deal }: { deal: MerchantDeal }) {
  const qc = useQueryClient();
  const [checked, setChecked] = useState(deal.status === 'active');

  useEffect(() => {
    setChecked(deal.status === 'active');
  }, [deal.status]);

  const mutation = useMutation({
    mutationFn: (status: DealStatus) => updateDealStatus(deal.id, status),
    onMutate: async (newStatus) => {
      await qc.cancelQueries({ queryKey: ['deals'] });
      const snapshot = qc.getQueriesData<MerchantDeal[]>({ queryKey: ['deals'] });
      snapshot.forEach(([key, old]) => {
        if (old) {
          qc.setQueryData<MerchantDeal[]>(key, old.map(d =>
            d.id === deal.id ? { ...d, status: newStatus } : d,
          ));
        }
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, old]) => qc.setQueryData(key, old));
      toast.error('Ошибка изменения статуса');
    },
    onSuccess: () => {
      toast.success('Статус изменён');
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const handleClick = () => {
    if (mutation.isPending || deal.status === 'rejected') return;
    const next = !checked;
    setChecked(next);
    mutation.mutate(next ? 'active' : 'paused', {
      onError: () => setChecked(!next),
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      disabled={mutation.isPending || deal.status === 'rejected'}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        backgroundColor: checked ? '#007AFF' : 'hsl(var(--input))',
        boxShadow: checked ? '0 0 0 3px rgba(0,122,255,0.18)' : 'none',
        transition: 'background-color 0.28s ease, box-shadow 0.28s ease',
      }}
    >
      <span
        className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg"
        style={{
          transform: checked ? 'translateX(1rem)' : 'translateX(0)',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.45, 0.64, 1)',
        }}
      />
    </button>
  );
}

export default function SalesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<MerchantDeal | null>(null);
  // 'deals' = акции tab, 'discounts' = скидки по планам tab
  const [activeTab, setActiveTab] = useState<'deals' | 'discounts'>('deals');
  const [modalOrigin, setModalOrigin] = useState<'deals' | 'discounts'>('deals');

  const { data: deals = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['deals', statusFilter, search],
    queryFn: () => fetchMerchantDeals({ status: statusFilter, search: search || undefined }),
  });
  const { data: partners = [] } = useQuery<Partner[]>({ queryKey: ['partners'], queryFn: fetchPartners });
  const { data: plans = [] } = useQuery<SubscriptionPlanSummary[]>({ queryKey: ['plans'], queryFn: fetchSubscriptionPlans });

  const form = useForm<DealFormValues>({ resolver: zodResolver(dealSchema) });

  useEffect(() => {
    if (partners.length > 0) {
      form.setValue('partner_id', String(partners[0].id));
    }
  }, [partners, form]);

  const openCreate = (origin: 'deals' | 'discounts') => {
    setModalOrigin(origin);
    setEditDeal(null);
    form.reset({ partner_id: String(partners[0]?.id ?? ''), subscription_plan: '', offer_type: '' });
    setFormOpen(true);
  };

  const offerTypesForModal = useMemo(() => {
    if (modalOrigin === 'deals') return ALL_OFFER_TYPES.filter((t) => t.value !== 'discount');
    return ALL_OFFER_TYPES.filter((t) => t.value === 'discount');
  }, [modalOrigin]);

  const dealsData = useMemo(() => deals.filter((d) => d.offer_type !== 'discount'), [deals]);
  const discountsData = useMemo(() => deals.filter((d) => d.offer_type === 'discount'), [deals]);

  const createMutation = useMutation({
    mutationFn: (v: DealFormValues) => createDeal({
      partner_id: Number(v.partner_id),
      subscription_plan: Number(v.subscription_plan),
      offer_type: v.offer_type,
      price: v.price,
      discount_percent: v.discount_percent ? Number(v.discount_percent) : undefined,
      start_at: v.start_at,
      end_at: v.end_at,
      title_translations: { uz: v.title_uz ?? '', ru: v.title_ru ?? '' },
      description_translations: { uz: v.description_uz ?? '', ru: v.description_ru ?? '' },
    }),
    onSuccess: () => { toast.success('Акция создана'); qc.invalidateQueries({ queryKey: ['deals'] }); setFormOpen(false); form.reset(); },
    onError: () => toast.error('Ошибка создания'),
  });

  const updateMutation = useMutation({
    mutationFn: (v: DealFormValues) => updateDeal(Number(v.partner_id), editDeal!.id, {
      partner_id: Number(v.partner_id),
      subscription_plan: Number(v.subscription_plan),
      offer_type: v.offer_type,
      price: v.price,
      discount_percent: v.discount_percent ? Number(v.discount_percent) : undefined,
      start_at: v.start_at,
      end_at: v.end_at,
      title_translations: { uz: v.title_uz ?? '', ru: v.title_ru ?? '' },
      description_translations: { uz: v.description_uz ?? '', ru: v.description_ru ?? '' },
    }),
    onSuccess: () => { toast.success('Акция обновлена'); qc.invalidateQueries({ queryKey: ['deals'] }); setEditDeal(null); },
    onError: () => toast.error('Ошибка обновления'),
  });

  const columns: ColumnDef<MerchantDeal>[] = useMemo(() => [
    {
      id: 'image', header: '',
      cell: ({ row }) => {
        const src = mediaUrl(row.original.image ?? row.original.partner_detail?.logo);
        return src ? <img src={src} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />;
      },
    },
    { accessorKey: 'title', header: 'Название' },
    { accessorKey: 'offer_type', header: 'Тип', cell: ({ getValue }) => <SaleTypeBadge type={getValue() as 'discount' | 'one_plus_one' | 'exclusive'} /> },
    { accessorKey: 'price', header: 'Цена', cell: ({ getValue }) => getValue() ? <MoneyText amount={getValue() as string} /> : '—' },
    { accessorKey: 'discount_percent', header: 'Скидка %', cell: ({ getValue }) => getValue() ? `${getValue()}%` : '—' },
    {
      accessorKey: 'status', header: 'Статус',
      cell: ({ getValue }) => {
        const s = getValue() as DealStatus;
        return <span key={s} className="badge-pop"><StatusBadge status={s} /></span>;
      },
    },
    { accessorKey: 'start_at', header: 'С', cell: ({ getValue }) => fmtDate(getValue() as string | null) },
    { accessorKey: 'end_at', header: 'До', cell: ({ getValue }) => fmtDate(getValue() as string | null) },
    {
      id: 'actions', header: 'Действия',
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="flex gap-1 items-center">
            <Button size="icon" variant="ghost" onClick={() => {
              setModalOrigin(d.offer_type === 'discount' ? 'discounts' : 'deals');
              setEditDeal(d);
              form.reset({
                partner_id: String(d.partner),
                subscription_plan: String(d.subscription_plan),
                offer_type: d.offer_type,
                price: d.price ?? '',
                discount_percent: String(d.discount_percent ?? ''),
                title_uz: d.title_translations?.uz ?? '',
                title_ru: d.title_translations?.ru ?? d.title,
                description_uz: d.description_translations?.uz ?? '',
                description_ru: d.description_translations?.ru ?? (d.description ?? ''),
              });
            }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <StatusSwitch deal={d} />
          </div>
        );
      },
    },
  ], [form]);

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Акции" description="Специальные предложения и скидки для клиентов" />
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'deals' | 'discounts')}>
        <TabsList className="mb-4">
          <TabsTrigger value="deals">Акции</TabsTrigger>
          <TabsTrigger value="discounts">Скидки по планам</TabsTrigger>
        </TabsList>

        <TabsContent value="deals">
          <div className="flex gap-3 mb-4 flex-wrap items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <SearchInput value={search} onChange={setSearch} className="w-64" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DealStatus | 'all')}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={() => openCreate('deals')}>
              <Plus className="h-4 w-4 mr-1" />Создать акцию
            </Button>
          </div>
          <DataTable columns={columns} data={dealsData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="discounts">
          <div className="flex gap-3 mb-4 flex-wrap items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <SearchInput value={search} onChange={setSearch} className="w-64" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DealStatus | 'all')}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={() => openCreate('discounts')}>
              <Plus className="h-4 w-4 mr-1" />Создать скидку
            </Button>
          </div>
          <DataTable columns={columns} data={discountsData} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit dialog */}
      <Dialog open={formOpen || !!editDeal} onOpenChange={(o) => { if (!o) { setFormOpen(false); setEditDeal(null); } }}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editDeal ? 'Редактировать акцию' : (modalOrigin === 'discounts' ? 'Новая скидка' : 'Новая акция')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => editDeal ? updateMutation.mutate(v) : createMutation.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="subscription_plan" render={({ field }) => (
                <FormItem><FormLabel>План подписки</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Выберите план" /></SelectTrigger></FormControl>
                    <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="offer_type" render={({ field }) => (
                <FormItem><FormLabel>Тип акции</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger></FormControl>
                    <SelectContent>{offerTypesForModal.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Цена (сум)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="discount_percent" render={({ field }) => (
                  <FormItem><FormLabel>Скидка %</FormLabel><FormControl><Input type="number" min={0} max={100} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="start_at" render={({ field }) => (
                  <FormItem><FormLabel>Дата начала</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="end_at" render={({ field }) => (
                  <FormItem><FormLabel>Дата окончания</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Tabs defaultValue="ru">
                <TabsList><TabsTrigger value="ru">RU</TabsTrigger><TabsTrigger value="uz">UZ</TabsTrigger></TabsList>
                <TabsContent value="ru" className="space-y-3">
                  <FormField control={form.control} name="title_ru" render={({ field }) => (
                    <FormItem><FormLabel>Название (RU)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description_ru" render={({ field }) => (
                    <FormItem><FormLabel>Описание (RU)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </TabsContent>
                <TabsContent value="uz" className="space-y-3">
                  <FormField control={form.control} name="title_uz" render={({ field }) => (
                    <FormItem><FormLabel>Название (UZ)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description_uz" render={({ field }) => (
                    <FormItem><FormLabel>Описание (UZ)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </TabsContent>
              </Tabs>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editDeal ? 'Сохранить' : 'Создать'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
