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
    <div
      className={cn('ios-card p-5', className)}
    >
      <div className="flex items-start justify-between mb-3">
        <p
          className="text-sm font-medium leading-snug"
          style={{ color: 'var(--ios-text-secondary)' }}
        >
          {title}
        </p>
        {icon && (
          <span
            className="flex items-center justify-center h-10 w-10 rounded-full shrink-0 ml-2"
            style={{
              background: 'rgba(0, 122, 255, 0.10)',
              color: 'var(--ios-blue)',
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        className="text-2xl font-bold tnum leading-tight"
        style={{ color: 'var(--ios-text-primary)' }}
      >
        {value}
      </div>

      {delta !== undefined && (
        <p
          className="text-xs mt-1.5 font-medium"
          style={{ color: delta >= 0 ? '#12BD09' : '#EE7070' }}
        >
          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% к прошлому месяцу
        </p>
      )}
    </div>
  );
}
