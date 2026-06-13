import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Tag, Star, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMockDashboard } from '@/api/mock';
import { formatMoney } from '@/lib/money';

function pct(current: number, prev: number) {
  if (!prev) return 0;
  return ((current - prev) / prev) * 100;
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchMockDashboard,
  });

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Обзор" description="Сводка по вашему бизнесу за текущий месяц" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : data ? (
          <>
            <KpiCard
              title="Выручка за месяц"
              value={formatMoney(data.revenue_month)}
              delta={pct(data.revenue_month, data.revenue_prev_month)}
              icon={<ShoppingBag className="h-5 w-5" />}
            />
            <KpiCard
              title="Заказы за месяц"
              value={data.orders_month}
              delta={pct(data.orders_month, data.orders_prev_month)}
              icon={<Tag className="h-5 w-5" />}
            />
            <KpiCard
              title="Активные акции"
              value={data.active_deals}
              icon={<Tag className="h-5 w-5" />}
            />
            <KpiCard
              title="Средняя оценка"
              value={`${data.avg_rating.toFixed(1)} ★`}
              icon={<Star className="h-5 w-5" />}
            />
          </>
        ) : null}
      </div>
      {!isLoading && data && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            title="Всего филиалов"
            value={data.total_branches}
            icon={<Building2 className="h-5 w-5" />}
          />
          <KpiCard
            title="Новых отзывов"
            value={data.new_reviews}
            icon={<Star className="h-5 w-5" />}
          />
        </div>
      )}
    </div>
  );
}
