import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-[rgba(0,122,255,0.25)] bg-[rgba(0,122,255,0.10)] text-[#007AFF]',
        secondary:   'border-[var(--ios-border)] bg-[var(--ios-bg)] text-[var(--ios-text-secondary)]',
        destructive: 'border-[rgba(238,112,112,0.30)] bg-[rgba(238,112,112,0.12)] text-[#EE7070]',
        outline:     'border-[var(--ios-border)] text-[var(--ios-text-secondary)]',
        success:     'border-[rgba(18,189,9,0.30)] bg-[rgba(18,189,9,0.10)] text-[#12BD09]',
        warning:     'border-[rgba(255,149,0,0.30)] bg-[rgba(255,149,0,0.12)] text-[#FF9500]',
        brand:       'border-[rgba(0,173,255,0.30)] bg-[rgba(0,173,255,0.10)] text-[#00ADFF]',
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
