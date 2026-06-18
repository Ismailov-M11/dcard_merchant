import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { fetchMockSalesAnalytics, fetchMockTrafficAnalytics, fetchMockRatingAnalytics, fetchMockReviews } from '@/api/mock';
import { formatMoney } from '@/lib/money';
import { fmtDate } from '@/lib/dates';
import { Star, MessageSquare } from 'lucide-react';

const CHART_COLORS = ['hsl(243,75%,59%)', 'hsl(173,58%,39%)', 'hsl(197,37%,24%)', 'hsl(43,74%,66%)', 'hsl(27,87%,67%)'];

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i <= Math.round(value) ? '#F59E0B' : 'none'}
          stroke={i <= Math.round(value) ? '#F59E0B' : 'currentColor'}
        />
      ))}
    </span>
  );
}

function ReviewsDialog({ open, onClose, outletOptions }: {
  open: boolean;
  onClose: () => void;
  outletOptions: { outlet_id: number; outlet_name: string }[];
}) {
  const [outletFilter, setOutletFilter] = useState<string>('all');

  const { data } = useQuery({
    queryKey: ['reviews', outletFilter],
    queryFn: () => fetchMockReviews(outletFilter !== 'all' ? { outlet_id: Number(outletFilter) } : undefined),
    enabled: open,
  });

  const reviews = data?.results ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Отзывы</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={outletFilter} onValueChange={setOutletFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Все филиалы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все филиалы</SelectItem>
              {outletOptions.map((o) => (
                <SelectItem key={o.outlet_id} value={String(o.outlet_id)}>{o.outlet_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Нет отзывов</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{r.customer_name}</span>
                          <StarRating value={r.rating} />
                          <Badge variant="secondary" className="text-xs">{r.outlet_name}</Badge>
                        </div>
                        {r.deal_title && <p className="text-xs text-muted-foreground">{r.deal_title}</p>}
                        {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
                        {r.reply && (
                          <div className="mt-2 pl-3 border-l-2 border-primary/30">
                            <p className="text-xs text-muted-foreground">Ответ:</p>
                            <p className="text-sm">{r.reply}</p>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{fmtDate(r.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AnalyticsPage() {
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const sales = useQuery({ queryKey: ['analytics', 'sales'], queryFn: fetchMockSalesAnalytics });
  const traffic = useQuery({ queryKey: ['analytics', 'traffic'], queryFn: fetchMockTrafficAnalytics });
  const rating = useQuery({ queryKey: ['analytics', 'rating'], queryFn: fetchMockRatingAnalytics });

  const isError = sales.isError || traffic.isError || rating.isError;
  if (isError) return <ErrorState onRetry={() => { sales.refetch(); traffic.refetch(); rating.refetch(); }} />;

  const outletOptions = rating.data?.by_outlet?.map((o) => ({ outlet_id: o.outlet_id, outlet_name: o.outlet_name })) ?? [];

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <KpiCard title="Выручка" value={formatMoney(sales.data.total_revenue)} />
                <KpiCard title="Заказы" value={String(sales.data.total_orders)} />
                <KpiCard title="Средний чек" value={formatMoney(sales.data.avg_order)} />
                <KpiCard title="Выручка (скидки)" value={formatMoney(sales.data.revenue_by_discount)} />
                <KpiCard title="Выручка (1+1)" value={formatMoney(sales.data.revenue_by_one_plus_one)} />
                <KpiCard title="Выручка (эксклюзив)" value={formatMoney(sales.data.revenue_by_exclusive)} />
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
                <KpiCard
                  title="Всего отзывов"
                  value={String(rating.data.total_reviews)}
                  action={
                    <button
                      type="button"
                      onClick={() => setReviewsOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1A3F75] hover:opacity-80 transition-opacity whitespace-nowrap"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Отзывы
                    </button>
                  }
                />
              </div>

              {/* Per-outlet ratings */}
              {rating.data.by_outlet && rating.data.by_outlet.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Рейтинг по филиалам</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {rating.data.by_outlet.map((o) => (
                      <Card key={o.outlet_id}>
                        <CardContent className="pt-4 pb-3">
                          <p className="text-sm font-medium truncate mb-1">{o.outlet_name}</p>
                          <div className="flex items-center gap-2">
                            <StarRating value={o.avg_rating} />
                            <span className="text-sm font-semibold">{o.avg_rating.toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{o.total_reviews} отзывов</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

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

      <ReviewsDialog
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        outletOptions={outletOptions}
      />
    </div>
  );
}
