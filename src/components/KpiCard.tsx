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
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white/55">{title}</p>
          {icon && (
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-[#1A3F75]/40 border border-[#4EA4CC]/15 text-[#4EA4CC]">
              {icon}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold tnum text-white">{value}</div>
        {delta !== undefined && (
          <p className={cn('text-xs mt-1.5', delta >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% к прошлому месяцу
          </p>
        )}
      </CardContent>
    </Card>
  );
}
