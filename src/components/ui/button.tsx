import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4EA4CC]/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[#1A3F75]/90 text-white shadow-lg shadow-[#1A3F75]/30 hover:bg-[#2B5BA8] border border-[#4EA4CC]/25 backdrop-blur-sm',
        destructive:
          'bg-red-500/75 text-white shadow-lg shadow-red-500/20 hover:bg-red-500/90 border border-red-400/30',
        outline:
          'border border-[#4EA4CC]/25 bg-[#1A3F75]/15 text-white/85 shadow-sm hover:bg-[#1A3F75]/30 hover:text-white backdrop-blur-sm',
        secondary:
          'bg-white/[0.08] text-white/85 shadow-sm hover:bg-white/[0.14] border border-white/[0.10]',
        ghost:
          'text-white/70 hover:bg-[#1A3F75]/30 hover:text-white',
        link:
          'text-[#4EA4CC] underline-offset-4 hover:underline hover:text-sky-300',
      },
      size: {
        default: 'h-9 px-5 py-2',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-11 px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
