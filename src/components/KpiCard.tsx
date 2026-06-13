import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: ReactNode;
  delta?: number;
  icon?: ReactNode;
  className?: string;
}

export function KpiCard({ title, value, delta, icon, className }: KpiCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <div className="text-2xl font-bold tnum">{value}</div>
        {delta !== undefined && (
          <p className={cn('text-xs mt-1', delta >= 0 ? 'text-emerald-600' : 'text-destructive')}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% к прошлому месяцу
          </p>
        )}
      </CardContent>
    </Card>
  );
}
