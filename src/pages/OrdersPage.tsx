import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import type { Order } from '@/types';
import { fetchMockOrders, fetchMockOrder, updateMockOrderStatus } from '@/api/mock';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { SaleTypeBadge } from '@/components/SaleTypeBadge';
import { MoneyText } from '@/components/MoneyText';
import { ErrorState } from '@/components/ErrorState';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { fmtDateTime } from '@/lib/dates';
import { Loader2, UserCheck, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const SALE_TYPE_OPTIONS = [
  { value: 'all', label: 'Все типы' },
  { value: 'discount', label: 'Скидка' },
  { value: 'one_plus_one', label: '1+1' },
  { value: 'exclusive', label: 'Эксклюзив' },
];

export default function OrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Active filter state
  const [outletFilter, setOutletFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dealFilter, setDealFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Draft filter state (inside modal, applied on confirm)
  const [draftOutlet, setDraftOutlet] = useState('all');
  const [draftType, setDraftType] = useState('all');
  const [draftDeal, setDraftDeal] = useState('all');
  const [draftStaff, setDraftStaff] = useState('all');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchMockOrders(),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['order', selectedId],
    queryFn: () => fetchMockOrder(selectedId!),
    enabled: selectedId !== null,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Order['status'] }) => updateMockOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Статус обновлён');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', selectedId] });
    },
    onError: () => toast.error('Ошибка обновления'),
  });

  const allOrders = useMemo(() => data?.results ?? [], [data]);

  const uniqueOutlets = useMemo(() => {
    const map = new Map<number, string>();
    allOrders.forEach((o) => map.set(o.outlet_id, o.outlet_name));
    return Array.from(map.entries()).map(([id, name]) => ({ value: String(id), label: name }));
  }, [allOrders]);

  const uniqueDeals = useMemo(() => {
    const map = new Map<number, string>();
    allOrders.forEach((o) => map.set(o.deal_id, o.deal_title));
    return Array.from(map.entries()).map(([id, title]) => ({ value: String(id), label: title }));
  }, [allOrders]);

  const uniqueStaff = useMemo(() => {
    const set = new Set<string>();
    allOrders.forEach((o) => { if (o.scanned_by) set.add(o.scanned_by); });
    return Array.from(set).map((s) => ({ value: s, label: s }));
  }, [allOrders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allOrders.filter((o) => {
      if (outletFilter !== 'all' && String(o.outlet_id) !== outletFilter) return false;
      if (typeFilter !== 'all' && o.sale_type !== typeFilter) return false;
      if (dealFilter !== 'all' && String(o.deal_id) !== dealFilter) return false;
      if (staffFilter !== 'all' && o.scanned_by !== staffFilter) return false;
      if (dateFrom && o.created_at < dateFrom) return false;
      if (dateTo && o.created_at > dateTo + 'T23:59:59Z') return false;
      if (q) {
        const haystack = [
          o.order_number, o.customer_name, o.customer_phone,
          o.outlet_name, o.deal_title, o.scanned_by ?? '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allOrders, search, outletFilter, typeFilter, dealFilter, staffFilter, dateFrom, dateTo]);

  const activeFilterCount = [
    outletFilter !== 'all',
    typeFilter !== 'all',
    dealFilter !== 'all',
    staffFilter !== 'all',
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const openFilters = () => {
    setDraftOutlet(outletFilter);
    setDraftType(typeFilter);
    setDraftDeal(dealFilter);
    setDraftStaff(staffFilter);
    setDraftDateFrom(dateFrom);
    setDraftDateTo(dateTo);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setOutletFilter(draftOutlet);
    setTypeFilter(draftType);
    setDealFilter(draftDeal);
    setStaffFilter(draftStaff);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftOutlet('all');
    setDraftType('all');
    setDraftDeal('all');
    setDraftStaff('all');
    setDraftDateFrom('');
    setDraftDateTo('');
  };

  const clearAllFilters = () => {
    setOutletFilter('all');
    setTypeFilter('all');
    setDealFilter('all');
    setStaffFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: 'order_number', header: '№ заказа',
      cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>,
    },
    { accessorKey: 'customer_name', header: 'Клиент' },
    { accessorKey: 'outlet_name', header: 'Филиал' },
    {
      accessorKey: 'sale_type', header: 'Тип',
      cell: ({ getValue }) => <SaleTypeBadge type={getValue() as Order['sale_type']} />,
    },
    {
      accessorKey: 'total_amount', header: 'Сумма',
      cell: ({ getValue }) => <MoneyText amount={getValue() as string} />,
    },
    {
      accessorKey: 'discount_amount', header: 'Скидка',
      cell: ({ getValue }) => <MoneyText amount={getValue() as string} />,
    },
    {
      accessorKey: 'created_at', header: 'Дата',
      cell: ({ getValue }) => fmtDateTime(getValue() as string),
    },
    {
      accessorKey: 'scanned_by', header: 'Сотрудник',
      cell: ({ getValue }) => {
        const v = getValue() as string | null | undefined;
        return v ? (
          <span className="flex items-center gap-1 text-sm">
            <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
            {v}
          </span>
        ) : <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => setSelectedId(row.original.id)}>Детали</Button>
      ),
    },
  ], []);

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Заказы" description="Все заказы по вашим акциям" />

      <div className="flex gap-3 mb-4 items-center">
        <SearchInput value={search} onChange={setSearch} className="flex-1" placeholder="Поиск по всем полям" />
        <Button variant="outline" onClick={openFilters} className="relative shrink-0">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Фильтры
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground gap-1">
            <X className="h-3.5 w-3.5" />
            Сбросить
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* Filters modal */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Фильтры</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Филиал</Label>
              <Select value={draftOutlet} onValueChange={setDraftOutlet}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все филиалы</SelectItem>
                  {uniqueOutlets.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Тип акции</Label>
              <Select value={draftType} onValueChange={setDraftType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SALE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Акция / скидка</Label>
              <Select value={draftDeal} onValueChange={setDraftDeal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все акции</SelectItem>
                  {uniqueDeals.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Сотрудник</Label>
              <Select value={draftStaff} onValueChange={setDraftStaff}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все сотрудники</SelectItem>
                  {uniqueStaff.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Дата с</Label>
                <Input type="date" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Дата по</Label>
                <Input type="date" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} />
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
              Сбросить всё
            </Button>
            <Button onClick={applyFilters}>
              Применить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order detail sheet */}
      <Sheet open={selectedId !== null} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Детали заказа</SheetTitle></SheetHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : detail ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Номер</span>
                <span className="font-mono font-medium">{detail.order_number}</span>
                <span className="text-muted-foreground">Клиент</span>
                <span>{detail.customer_name}</span>
                <span className="text-muted-foreground">Телефон</span>
                <span>{detail.customer_phone}</span>
                <span className="text-muted-foreground">Филиал</span>
                <span>{detail.outlet_name}</span>
                <span className="text-muted-foreground">Акция</span>
                <span>{detail.deal_title}</span>
                <span className="text-muted-foreground">Тип</span>
                <SaleTypeBadge type={detail.sale_type} />
                <span className="text-muted-foreground">Сумма</span>
                <MoneyText amount={detail.total_amount} className="font-semibold" />
                <span className="text-muted-foreground">Скидка</span>
                <MoneyText amount={detail.discount_amount} />
                <span className="text-muted-foreground">Статус</span>
                <StatusBadge status={detail.status} />
                {detail.scanned_by && (
                  <>
                    <span className="text-muted-foreground">Сотрудник</span>
                    <span>{detail.scanned_by}</span>
                  </>
                )}
                <span className="text-muted-foreground">Создан</span>
                <span>{fmtDateTime(detail.created_at)}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Изменить статус</p>
                <div className="flex gap-2 flex-wrap">
                  {(['confirmed', 'completed', 'cancelled'] as Order['status'][]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={detail.status === s ? 'default' : 'outline'}
                      disabled={detail.status === s || statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: detail.id, status: s })}
                    >
                      {s === 'confirmed' ? 'Подтвердить' : s === 'completed' ? 'Выполнен' : 'Отменить'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
