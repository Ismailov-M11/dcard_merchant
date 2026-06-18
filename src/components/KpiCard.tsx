import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: ReactNode;
  delta?: number;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function KpiCard({ title, value, delta, icon, action, className }: KpiCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon && (
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-[#1A3F75]/15 border border-[#1A3F75]/20 text-[#1A3F75] dark:text-[#4EA4CC] dark:bg-[#1A3F75]/40 dark:border-[#4EA4CC]/15">
              {icon}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="text-2xl font-bold tnum text-foreground">{value}</div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {delta !== undefined && (
          <p className={cn('text-xs mt-1.5', delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% к прошлому месяцу
          </p>
        )}
      </CardContent>
    </Card>
  );
}
