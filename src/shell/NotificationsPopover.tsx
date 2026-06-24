import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        <button
          className="relative h-8 w-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--ios-bg)]"
          aria-label="Уведомления"
          style={{ color: 'var(--ios-text-secondary)' }}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 h-4 w-4 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
              style={{ background: '#EE7070' }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        style={{
          background: 'var(--ios-card)',
          border: '1px solid var(--ios-border)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--ios-divider)' }}>
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--ios-text-primary)' }}
          >
            Уведомления
          </span>
          {unreadCount > 0 && (
            <button
              onClick={() => mutation.mutate()}
              className="text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: '#007AFF' }}
            >
              Прочитать все
            </button>
          )}
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <p
              className="text-center text-sm py-8"
              style={{ color: 'var(--ios-text-secondary)' }}
            >
              Нет уведомлений
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'px-4 py-3 border-b last:border-0',
                )}
                style={{
                  borderColor: 'var(--ios-divider)',
                  background: !n.is_read ? 'rgba(0, 122, 255, 0.04)' : undefined,
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: !n.is_read ? '#007AFF' : 'var(--ios-text-primary)' }}
                >
                  {n.title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--ios-text-secondary)' }}
                >
                  {n.body}
                </p>
                <p
                  className="text-[10px] mt-1"
                  style={{ color: 'var(--ios-text-tertiary)' }}
                >
                  {fmtDateTime(n.created_at)}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
