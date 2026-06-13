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
          'bg-[#1A3F75] text-white shadow-lg shadow-[#1A3F75]/25 hover:bg-[#2B5BA8] border border-[#4EA4CC]/20 backdrop-blur-sm',
        destructive:
          'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 border border-red-500/30',
        outline:
          'border border-[#1A3F75]/25 bg-[#1A3F75]/10 text-foreground shadow-sm hover:bg-[#1A3F75]/20 hover:text-foreground backdrop-blur-sm',
        secondary:
          'bg-[#1A3F75]/12 text-foreground shadow-sm hover:bg-[#1A3F75]/20 border border-[#1A3F75]/15',
        ghost:
          'text-foreground/70 hover:bg-[#1A3F75]/15 hover:text-foreground',
        link:
          'text-[#1A3F75] underline-offset-4 hover:underline hover:text-[#2B5BA8] dark:text-[#4EA4CC] dark:hover:text-sky-300',
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
