import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchMockSalesAnalytics, fetchMockTrafficAnalytics, fetchMockRatingAnalytics } from '@/api/mock';
import { formatMoney } from '@/lib/money';

const CHART_COLORS = ['hsl(243,75%,59%)', 'hsl(173,58%,39%)', 'hsl(197,37%,24%)', 'hsl(43,74%,66%)', 'hsl(27,87%,67%)'];

export default function AnalyticsPage() {
  const sales = useQuery({ queryKey: ['analytics', 'sales'], queryFn: fetchMockSalesAnalytics });
  const traffic = useQuery({ queryKey: ['analytics', 'traffic'], queryFn: fetchMockTrafficAnalytics });
  const rating = useQuery({ queryKey: ['analytics', 'rating'], queryFn: fetchMockRatingAnalytics });

  const isError = sales.isError || traffic.isError || rating.isError;
  if (isError) return <ErrorState onRetry={() => { sales.refetch(); traffic.refetch(); rating.refetch(); }} />;

  return (
    <div>
      <PageHeader title="Аналитика" description="Данные за последние 7 дней" />
      <Tabs defaultValue="sales">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Продажи</TabsTrigger>
          <TabsTrigger value="traffic">Трафик</TabsTrigger>
          <TabsTrigger value="rating">Рейтинг</TabsTrigger>
        </TabsList>

        {/* Sales tab */}
        <TabsContent value="sales">
          {sales.isLoading ? <Skeleton className="h-64 rounded-xl" /> : sales.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Выручка" value={formatMoney(sales.data.total_revenue)} />
                <KpiCard title="Заказы" value={sales.data.total_orders} />
                <KpiCard title="Скидки" value={formatMoney(sales.data.total_discount)} />
                <KpiCard title="Средний чек" value={formatMoney(sales.data.avg_order)} />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Выручка по дням</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={sales.data.points}>
                      <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [formatMoney(Number(v)), 'Выручка']} labelFormatter={(l) => `Дата: ${l}`} />
                      <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} fill="url(#grad1)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* Traffic tab */}
        <TabsContent value="traffic">
          {traffic.isLoading ? <Skeleton className="h-64 rounded-xl" /> : traffic.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Просмотры" value={traffic.data.total_views.toLocaleString('ru-RU')} />
                <KpiCard title="Клики" value={traffic.data.total_clicks.toLocaleString('ru-RU')} />
                <KpiCard title="Конверсии" value={traffic.data.total_conversions} />
                <KpiCard title="Конверсия" value={`${traffic.data.conversion_rate.toFixed(1)}%`} />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Трафик по дням</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={traffic.data.points}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="views" name="Просмотры" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clicks" name="Клики" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* Rating tab */}
        <TabsContent value="rating">
          {rating.isLoading ? <Skeleton className="h-64 rounded-xl" /> : rating.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <KpiCard title="Средняя оценка" value={`${rating.data.avg_rating.toFixed(1)} ★`} />
                <KpiCard title="Всего отзывов" value={rating.data.total_reviews} />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Распределение оценок</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={rating.data.distribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="stars" type="category" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}★`} width={32} />
                      <Tooltip />
                      <Bar dataKey="count" name="Отзывов" radius={[0, 4, 4, 0]}>
                        {rating.data.distribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
