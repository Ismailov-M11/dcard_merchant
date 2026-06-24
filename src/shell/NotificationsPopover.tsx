import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { fetchNotifications, markAllNotificationsRead } from '@/api/notifications';
import { fmtDateTime } from '@/lib/dates';
import { cn } from '@/lib/cn';

export function NotificationsPopover() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const mutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.results ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Уведомления">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-medium">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-semibold">Уведомления</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => mutation.mutate()}>
              Прочитать все
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Нет уведомлений</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={cn('p-3 border-b last:border-0', !n.is_read && 'bg-primary/5')}>
                <p className={cn('text-sm font-medium', !n.is_read && 'text-primary')}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{fmtDateTime(n.created_at)}</p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
