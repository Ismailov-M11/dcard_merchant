import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Переключить тему"
      className="h-8 w-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--ios-bg)]"
      style={{ color: 'var(--ios-text-secondary)' }}
    >
      {theme === 'dark'
        ? <Sun className="h-[18px] w-[18px]" />
        : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
