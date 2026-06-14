import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { fetchOutlets } from '@/api/outlets';
import { addStaffMember, deleteStaffMember, fetchStaff, updateStaffMember, updateStaffPassword, type StaffMember } from '@/api/staff';
import type { Outlet } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { SearchInput } from '@/components/SearchInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Менеджер' },
  { value: 'cashier', label: 'Кассир' },
  { value: 'validator', label: 'Сканер' },
];

const createSchema = z.object({
  phone: z.string().min(9, 'Введите телефон'),
  full_name: z.string().optional(),
  outlet_id: z.string().min(1, 'Выберите филиал'),
  staff_roles: z.string().min(1, 'Выберите роль'),
});
type CreateValues = z.infer<typeof createSchema>;

const passwordSchema = z.object({
  password: z.string().min(6, 'Минимум 6 символов'),
});
type PasswordValues = z.infer<typeof passwordSchema>;

export default function StaffPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [outletFilter, setOutletFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [passwordStaff, setPasswordStaff] = useState<StaffMember | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);

  const { data: outlets = [] } = useQuery<Outlet[]>({ queryKey: ['outlets'], queryFn: () => fetchOutlets() });
  const { data: staff = [], isLoading, isError, refetch } = useQuery<StaffMember[]>({
    queryKey: ['staff', outletFilter, search],
    queryFn: () => fetchStaff({ outletId: outletFilter === 'all' ? 'all' : Number(outletFilter), search: search || undefined }),
  });

  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });
  const editForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (v: CreateValues) => addStaffMember(Number(v.outlet_id), { phone: v.phone, full_name: v.full_name, staff_roles: [v.staff_roles] }),
    onSuccess: () => { toast.success('Сотрудник добавлен'); qc.invalidateQueries({ queryKey: ['staff'] }); setCreateOpen(false); createForm.reset(); },
    onError: (err: unknown) => { const d = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail; toast.error(d ?? 'Ошибка'); },
  });

  const editMutation = useMutation({
    mutationFn: (v: CreateValues) => updateStaffMember(editStaff!.id, { phone: v.phone, full_name: v.full_name, staff_roles: [v.staff_roles], outlet_id: Number(v.outlet_id) }),
    onSuccess: () => { toast.success('Данные обновлены'); qc.invalidateQueries({ queryKey: ['staff'] }); setEditStaff(null); },
    onError: () => toast.error('Ошибка обновления'),
  });

  const passwordMutation = useMutation({
    mutationFn: (v: PasswordValues) => updateStaffPassword(passwordStaff!.id, v.password),
    onSuccess: () => { toast.success('Пароль обновлён'); setPasswordStaff(null); passwordForm.reset(); },
    onError: () => toast.error('Ошибка обновления пароля'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStaffMember(id),
    onSuccess: () => { toast.success('Сотрудник удалён'); qc.invalidateQueries({ queryKey: ['staff'] }); setDeleteStaff(null); },
    onError: () => toast.error('Ошибка удаления'),
  });

  const columns: ColumnDef<StaffMember>[] = useMemo(() => [
    { accessorKey: 'phone', header: 'Телефон' },
    { accessorKey: 'full_name', header: 'Имя', cell: ({ getValue }) => (getValue() as string) || '—' },
    { accessorKey: 'outlet_name', header: 'Филиал' },
    {
      accessorKey: 'staff_roles', header: 'Роли',
      cell: ({ getValue }) => (
        <div className="flex gap-1 flex-wrap">
          {((getValue() as string[]) ?? []).map((r) => <Badge key={r} variant="secondary">{ROLE_OPTIONS.find(o => o.value === r)?.label ?? r}</Badge>)}
        </div>
      ),
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => { setEditStaff(row.original); editForm.reset({ phone: row.original.phone, full_name: row.original.full_name, outlet_id: String(row.original.outlet_id), staff_roles: row.original.staff_roles[0] ?? '' }); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setPasswordStaff(row.original)}>
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteStaff(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [editForm]);

  if (isError) return <ErrorState onRetry={refetch} />;

  const outletOptions = outlets.map((o) => ({ value: String(o.id), label: o.name }));

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description="Управляйте доступом сотрудников к панели"
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />Добавить</Button>}
      />
      <div className="flex gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} className="w-64" placeholder="Поиск по телефону / имени" />
        <Select value={outletFilter} onValueChange={setOutletFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Все филиалы" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все филиалы</SelectItem>
            {outletOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={staff} isLoading={isLoading} />

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Добавить сотрудника</DialogTitle></DialogHeader>
          <StaffForm form={createForm} outletOptions={outletOptions} onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))} isPending={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editStaff} onOpenChange={(o) => !o && setEditStaff(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать сотрудника</DialogTitle></DialogHeader>
          <StaffForm form={editForm} outletOptions={outletOptions} onSubmit={editForm.handleSubmit((v) => editMutation.mutate(v))} isPending={editMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Password */}
      <Dialog open={!!passwordStaff} onOpenChange={(o) => !o && setPasswordStaff(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Изменить пароль</DialogTitle></DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutate(v))} className="space-y-4">
              <FormField control={passwordForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Новый пароль</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Сохранить
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteStaff}
        onOpenChange={(o) => !o && setDeleteStaff(null)}
        title="Удалить сотрудника?"
        description={`Сотрудник ${deleteStaff?.full_name ?? deleteStaff?.phone} будет удалён.`}
        confirmLabel="Удалить"
        destructive
        onConfirm={() => deleteStaff && deleteMutation.mutate(deleteStaff.id)}
      />
    </div>
  );
}

function StaffForm({ form, outletOptions, onSubmit, isPending }: {
  form: ReturnType<typeof useForm<CreateValues>>;
  outletOptions: { value: string; label: string }[];
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>Телефон</FormLabel><FormControl><Input placeholder="+998..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="full_name" render={({ field }) => (
          <FormItem><FormLabel>Имя</FormLabel><FormControl><Input placeholder="Алишер Каримов" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="outlet_id" render={({ field }) => (
          <FormItem><FormLabel>Филиал</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue placeholder="Выберите филиал" /></SelectTrigger></FormControl>
              <SelectContent>{outletOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="staff_roles" render={({ field }) => (
          <FormItem><FormLabel>Роль</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue placeholder="Выберите роль" /></SelectTrigger></FormControl>
              <SelectContent>{ROLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Сохранить
        </Button>
      </form>
    </Form>
  );
}
