import { useQuery } from '@tanstack/react-query';
import { Tag, Building2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/api/dashboard';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Обзор" description="Сводка по вашему бизнесу" />

      {/* Notice about partially unavailable data */}
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Некоторые показатели (выручка, заказы за месяц, рейтинг, отзывы) недоступны — для них требуется
          дополнительный API на бэкенде. Подробности в{' '}
          <code className="font-mono text-xs">MISSING_APIS.md</code>.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : data ? (
          <>
            <KpiCard
              title="Активные акции"
              value={data.active_deals}
              icon={<Tag className="h-5 w-5" />}
            />
            <KpiCard
              title="Всего филиалов"
              value={data.total_branches}
              icon={<Building2 className="h-5 w-5" />}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
