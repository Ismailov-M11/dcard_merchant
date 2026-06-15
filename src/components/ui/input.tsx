import * as React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl px-4 py-2 text-sm transition-all outline-none',
        'bg-[var(--ios-bg)] border border-[var(--ios-border)]',
        'text-[var(--ios-text-primary)] placeholder:text-[var(--ios-text-secondary)]',
        'focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.15)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
