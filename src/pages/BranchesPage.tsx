import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Loader2, MapPin, ImageUp } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { createOutlet, deleteOutlet, fetchOutlets, fetchPartners, updateOutlet, type OutletPayload } from '@/api/outlets';
import type { Outlet, Partner, OutletLocation } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import LocationPicker from '@/components/LocationPicker';

const CYRILLIC_MAP: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',
  ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};

function generateSlug(name: string): string {
  const transliterated = name.toLowerCase().split('').map((c) => CYRILLIC_MAP[c] ?? c).join('');
  const base = transliterated.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (base || 'outlet') + '-' + Date.now().toString(36);
}

const branchSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  city: z.string().min(1, 'Введите город'),
  address: z.string().min(1, 'Введите адрес'),
});
type BranchFormValues = z.infer<typeof branchSchema>;

export default function BranchesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editOutlet, setEditOutlet] = useState<Outlet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Outlet | null>(null);
  const [location, setLocation] = useState<OutletLocation | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editPartnerId, setEditPartnerId] = useState<number>(1);

  const { data: outlets = [], isLoading, isError, refetch } = useQuery<Outlet[]>({
    queryKey: ['outlets', search],
    queryFn: () => fetchOutlets({ search: search || undefined }),
  });
  const { data: partners = [] } = useQuery<Partner[]>({ queryKey: ['partners'], queryFn: fetchPartners });

  const form = useForm<BranchFormValues>({ resolver: zodResolver(branchSchema) });

  const openCreate = () => {
    setEditOutlet(null);
    setLocation(null);
    setImageFile(null);
    setEditPartnerId(partners[0]?.id ?? 1);
    form.reset();
    setFormOpen(true);
  };

  const openEdit = (o: Outlet) => {
    setEditOutlet(o);
    setLocation(o.location ?? null);
    setImageFile(null);
    setEditPartnerId(o.partner.id);
    form.reset({ name: o.name, city: o.city, address: o.address });
    setFormOpen(true);
  };

  const buildPayload = (v: BranchFormValues): OutletPayload => ({
    name: v.name,
    city: v.city,
    address: v.address,
    slug: editOutlet?.slug ?? generateSlug(v.name),
    partner_id: editPartnerId || partners[0]?.id || 1,
    outlet_type_id: null,
    location: location ?? undefined,
  });

  const createMutation = useMutation({
    mutationFn: (v: BranchFormValues) => createOutlet(buildPayload(v), imageFile),
    onSuccess: () => { toast.success('Филиал создан'); qc.invalidateQueries({ queryKey: ['outlets'] }); setFormOpen(false); },
    onError: () => toast.error('Ошибка создания'),
  });

  const updateMutation = useMutation({
    mutationFn: (v: BranchFormValues) => updateOutlet(editOutlet!.id, buildPayload(v), imageFile),
    onSuccess: () => { toast.success('Филиал обновлён'); qc.invalidateQueries({ queryKey: ['outlets'] }); setFormOpen(false); setEditOutlet(null); },
    onError: () => toast.error('Ошибка обновления'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOutlet(id),
    onSuccess: () => { toast.success('Филиал удалён'); qc.invalidateQueries({ queryKey: ['outlets'] }); setDeleteTarget(null); },
    onError: () => toast.error('Ошибка удаления'),
  });

  const columns: ColumnDef<Outlet>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Название' },
    { accessorKey: 'city', header: 'Город' },
    { accessorKey: 'address', header: 'Адрес' },
    {
      accessorKey: 'location', header: '',
      cell: ({ getValue }) => getValue() ? <MapPin className="h-4 w-4 text-primary" /> : null,
    },
    {
      id: 'actions', header: 'Действия',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => openEdit(row.original)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(row.original)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], []);

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Филиалы" description="Управляйте вашими точками продаж" actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Добавить</Button>} />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} className="w-64" />
      </div>
      <DataTable columns={columns} data={outlets} isLoading={isLoading} />

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) { setFormOpen(false); setEditOutlet(null); } }}>
        <DialogContent className="max-w-xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle>{editOutlet ? 'Редактировать филиал' : 'Новый филиал'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => editOutlet ? updateMutation.mutate(v) : createMutation.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Название</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>Город</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Адрес</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div>
                <p className="text-sm font-medium mb-2">Фото</p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground bg-[#1A3F75] hover:bg-[#1D4A90] transition-colors shadow-sm select-none">
                  <ImageUp className="h-4 w-4" />
                  {imageFile ? imageFile.name : 'Выбрать файл'}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Местоположение</p>
                <LocationPicker
                  value={location}
                  onChange={setLocation}
                  onAddressChange={(payload) => {
                    if (payload?.address) form.setValue('address', payload.address);
                    if (payload?.city) form.setValue('city', payload.city);
                  }}
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editOutlet ? 'Сохранить' : 'Создать'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Удалить филиал?"
        description={`Филиал «${deleteTarget?.name}» будет удалён.`}
        confirmLabel="Удалить"
        destructive
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
