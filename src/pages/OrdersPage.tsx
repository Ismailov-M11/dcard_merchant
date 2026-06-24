import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import type { VerificationLog } from '@/types';
import { fetchAllVerificationLogs } from '@/api/verificationLogs';
import { fetchOutlets } from '@/api/outlets';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { ErrorState } from '@/components/ErrorState';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { fmtDateTime } from '@/lib/dates';
import { Loader2, UserCheck, SlidersHorizontal, X } from 'lucide-react';

function VerificationStatusBadge({ status }: { status: VerificationLog['status'] }) {
  const map: Record<VerificationLog['status'], { label: string; color: string }> = {
    valid: { label: 'Успешно', color: 'bg-green-100 text-green-800' },
    invalid: { label: 'Ошибка', color: 'bg-red-100 text-red-800' },
    expired: { label: 'Истёк', color: 'bg-yellow-100 text-yellow-800' },
    blacklisted: { label: 'Заблокирован', color: 'bg-gray-100 text-gray-600' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<VerificationLog | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [outletFilter, setOutletFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [draftOutlet, setDraftOutlet] = useState('all');
  const [draftStatus, setDraftStatus] = useState('all');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');

  const { data: outlets = [], isError: outletsError } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => fetchOutlets(),
  });

  const outletMeta = useMemo(
    () => outlets.map((o) => ({ id: o.id, name: o.name })),
    [outlets],
  );

  const { data: logs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['verification-logs', outletMeta.map((o) => o.id).join(',')],
    queryFn: () => fetchAllVerificationLogs(outletMeta),
    enabled: outletMeta.length > 0,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => {
      if (outletFilter !== 'all' && String(log.outlet_id) !== outletFilter) return false;
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (dateFrom && log.timestamp < dateFrom) return false;
      if (dateTo && log.timestamp > dateTo + 'T23:59:59Z') return false;
      if (q) {
        const haystack = [
          log.verification_id,
          log.user,
          log.outlet_name,
          log.special_offer ?? '',
          log.plan ?? '',
          log.merchant_staff ?? '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, outletFilter, statusFilter, dateFrom, dateTo]);

  const activeFilterCount = [
    outletFilter !== 'all',
    statusFilter !== 'all',
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const openFilters = () => {
    setDraftOutlet(outletFilter);
    setDraftStatus(statusFilter);
    setDraftDateFrom(dateFrom);
    setDraftDateTo(dateTo);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setOutletFilter(draftOutlet);
    setStatusFilter(draftStatus);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftOutlet('all');
    setDraftStatus('all');
    setDraftDateFrom('');
    setDraftDateTo('');
  };

  const clearAllFilters = () => {
    setOutletFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const columns: ColumnDef<VerificationLog>[] = useMemo(() => [
    {
      accessorKey: 'verification_id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {(getValue() as string).slice(0, 8)}…
        </span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Клиент (телефон)',
    },
    {
      accessorKey: 'outlet_name',
      header: 'Филиал',
    },
    {
      accessorKey: 'special_offer',
      header: 'Акция',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ?? <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    {
      accessorKey: 'discount_percent',
      header: 'Скидка',
      cell: ({ getValue }) => `${getValue()}%`,
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ getValue }) => <VerificationStatusBadge status={getValue() as VerificationLog['status']} />,
    },
    {
      accessorKey: 'timestamp',
      header: 'Дата',
      cell: ({ getValue }) => fmtDateTime(getValue() as string),
    },
    {
      accessorKey: 'merchant_staff',
      header: 'Сотрудник',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? (
          <span className="flex items-center gap-1 text-sm">
            <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
            {v}
          </span>
        ) : <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => setSelectedLog(row.original)}>
          Детали
        </Button>
      ),
    },
  ], []);

  if (isError || outletsError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Верификации" description="История сканирований QR-кодов клиентов по вашим акциям" />

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
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={draftStatus} onValueChange={setDraftStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="valid">Успешно</SelectItem>
                  <SelectItem value="invalid">Ошибка</SelectItem>
                  <SelectItem value="expired">Истёк</SelectItem>
                  <SelectItem value="blacklisted">Заблокирован</SelectItem>
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
            <Button onClick={applyFilters}>Применить</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log detail sheet */}
      <Sheet open={selectedLog !== null} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Детали верификации</SheetTitle></SheetHeader>
          {selectedLog ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs break-all">{selectedLog.verification_id}</span>
                <span className="text-muted-foreground">Клиент</span>
                <span>{selectedLog.user}</span>
                <span className="text-muted-foreground">Филиал</span>
                <span>{selectedLog.outlet_name}</span>
                <span className="text-muted-foreground">Акция</span>
                <span>{selectedLog.special_offer ?? '—'}</span>
                <span className="text-muted-foreground">Тарифный план</span>
                <span>{selectedLog.plan ?? '—'}</span>
                <span className="text-muted-foreground">Скидка</span>
                <span>{selectedLog.discount_percent}%</span>
                <span className="text-muted-foreground">Статус</span>
                <VerificationStatusBadge status={selectedLog.status} />
                {selectedLog.merchant_staff && (
                  <>
                    <span className="text-muted-foreground">Сотрудник</span>
                    <span>{selectedLog.merchant_staff}</span>
                  </>
                )}
                <span className="text-muted-foreground">Дата и время</span>
                <span>{fmtDateTime(selectedLog.timestamp)}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
