import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageHeader({
  title: _title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  if (!description && !actions) return null;
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-4', className)}>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {actions && <div className="flex items-center gap-2 shrink-0 ml-auto">{actions}</div>}
    </div>
  );
}
