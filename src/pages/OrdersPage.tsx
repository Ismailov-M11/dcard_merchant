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
import { Separator } from '@/components/ui/separator';
import { fmtDateTime } from '@/lib/dates';
import { Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'new', label: 'Новые' },
  { value: 'confirmed', label: 'Подтверждённые' },
  { value: 'completed', label: 'Выполненные' },
  { value: 'cancelled', label: 'Отменённые' },
];

export default function OrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => fetchMockOrders({ status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['order', selectedId],
    queryFn: () => fetchMockOrder(selectedId!),
    enabled: selectedId !== null,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Order['status'] }) => updateMockOrderStatus(id, status),
    onSuccess: () => { toast.success('Статус обновлён'); qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['order', selectedId] }); },
    onError: () => toast.error('Ошибка обновления'),
  });

  const filtered = useMemo(() => {
    const results = data?.results ?? [];
    if (!search) return results;
    const q = search.toLowerCase();
    return results.filter((o) => o.order_number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q));
  }, [data, search]);

  const columns: ColumnDef<Order>[] = useMemo(() => [
    { accessorKey: 'order_number', header: '№ заказа', cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span> },
    { accessorKey: 'customer_name', header: 'Клиент' },
    { accessorKey: 'outlet_name', header: 'Филиал' },
    { accessorKey: 'sale_type', header: 'Тип', cell: ({ getValue }) => <SaleTypeBadge type={getValue() as Order['sale_type']} /> },
    { accessorKey: 'total_amount', header: 'Сумма', cell: ({ getValue }) => <MoneyText amount={getValue() as string} /> },
    { accessorKey: 'status', header: 'Статус', cell: ({ getValue }) => <StatusBadge status={getValue() as Order['status']} /> },
    { accessorKey: 'created_at', header: 'Дата', cell: ({ getValue }) => fmtDateTime(getValue() as string) },
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
      <div className="flex gap-3 mb-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} className="w-64" placeholder="Поиск по номеру / клиенту" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

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
