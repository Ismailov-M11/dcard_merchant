import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:   'border-[#4EA4CC]/35 bg-[#1A3F75]/30 text-[#4EA4CC]',
        secondary: 'border-white/15 bg-white/[0.08] text-white/75',
        destructive:'border-red-500/40 bg-red-500/20 text-red-300',
        outline:   'border-[#4EA4CC]/25 text-white/70',
        success:   'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
        warning:   'border-amber-500/40 bg-amber-500/20 text-amber-300',
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
