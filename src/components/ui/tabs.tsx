import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

const Tabs = TabsPrimitive.Root;

const PILL_TRANSITION = [
  'left   0.30s cubic-bezier(0.34, 1.35, 0.64, 1)',
  'width  0.30s cubic-bezier(0.34, 1.35, 0.64, 1)',
  'top    0.30s cubic-bezier(0.34, 1.35, 0.64, 1)',
  'height 0.30s cubic-bezier(0.34, 1.35, 0.64, 1)',
].join(', ');

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef   = React.useRef<HTMLDivElement>(null);
  const pillRef   = React.useRef<HTMLDivElement>(null);

  const movePill = React.useCallback(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;
    const active = list.querySelector<HTMLElement>('[data-state=active]');
    if (!active) return;
    pill.style.left   = `${active.offsetLeft}px`;
    pill.style.top    = `${active.offsetTop}px`;
    pill.style.width  = `${active.offsetWidth}px`;
    pill.style.height = `${active.offsetHeight}px`;
  }, []);

  React.useEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    // Set initial position instantly (no animation)
    pill.style.transition = 'none';
    movePill();
    void pill.offsetWidth; // force reflow
    pill.style.transition = PILL_TRANSITION;

    // Watch for active tab changes
    const observer = new MutationObserver(() => {
      requestAnimationFrame(movePill);
    });
    if (listRef.current) {
      observer.observe(listRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-state'],
      });
    }
    return () => observer.disconnect();
  }, [movePill]);

  return (
    <TabsPrimitive.List
      ref={(node) => {
        (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        'relative inline-flex h-10 items-center justify-center rounded-2xl p-1 text-foreground/60',
        'bg-[#1A3F75]/10 border border-[#1A3F75]/15 dark:bg-[#1A3F75]/20 dark:border-[#4EA4CC]/15',
        className,
      )}
      {...props}
    >
      {/* Sliding pill — positioned purely via JS, no React style prop */}
      <div ref={pillRef} aria-hidden className="absolute rounded-xl bg-[#1A3F75] shadow-sm pointer-events-none" />
      {children}
    </TabsPrimitive.List>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-medium',
      'transition-colors duration-200 cursor-pointer select-none',
      'focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:text-white',
      'data-[state=inactive]:hover:text-foreground/90',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-2 focus-visible:outline-none tab-content-enter', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
