import * as React from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[72px] w-full rounded-xl px-4 py-3 text-sm transition-all outline-none resize-none',
        'bg-[var(--ios-bg)] border border-[var(--ios-border)]',
        'text-[var(--ios-text-primary)] placeholder:text-[var(--ios-text-secondary)]',
        'focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.15)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
