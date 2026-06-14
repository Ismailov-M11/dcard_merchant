import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:    'border-[#1A3F75]/30 bg-[#1A3F75]/12 text-[#1A3F75] dark:border-[#4EA4CC]/35 dark:bg-[#1A3F75]/30 dark:text-[#4EA4CC]',
        secondary:  'border-border bg-muted text-muted-foreground',
        destructive:'border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-300',
        outline:    'border-[#1A3F75]/25 text-foreground/70',
        success:    'border-emerald-600/40 bg-emerald-500/12 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300',
        warning:    'border-amber-600/40 bg-amber-500/12 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300',
        brand:      'border-[rgba(210,158,24,0.50)] bg-[rgba(240,178,42,0.14)] text-[#8a6000] dark:border-[rgba(240,178,42,0.45)] dark:bg-[rgba(240,178,42,0.16)] dark:text-amber-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
