import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : 'Что-то пошло не так';
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <AlertCircle className="h-10 w-10 text-destructive/60" />
      <p className="text-sm font-medium text-foreground">Ошибка загрузки</p>
      <p className="text-xs text-muted-foreground max-w-xs">{msg}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Попробовать снова</Button>}
    </div>
  );
}
