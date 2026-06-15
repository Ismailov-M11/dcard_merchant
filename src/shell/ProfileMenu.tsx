import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { startLogoutTransition } from '@/lib/loginTransition';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/AuthContext';

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.first_name ? user.first_name[0].toUpperCase() : user?.phone.slice(-2) ?? '??';

  function handleLogout() {
    startLogoutTransition();
    logout();
    navigate('/login');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]"
          aria-label="Профиль"
        >
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none"
            style={{ background: '#007AFF' }}
          >
            {initials}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        style={{
          background: 'var(--ios-card)',
          border: '1px solid var(--ios-border)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        }}
      >
        <DropdownMenuLabel className="font-normal px-3 py-2.5">
          <p
            className="font-semibold text-sm"
            style={{ color: 'var(--ios-text-primary)' }}
          >
            {user?.first_name ?? 'Пользователь'}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--ios-text-secondary)' }}
          >
            {user?.phone}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ background: 'var(--ios-divider)' }} />
        <DropdownMenuItem
          onClick={() => navigate('/profile')}
          className="cursor-pointer px-3 py-2"
          style={{ color: 'var(--ios-text-primary)' }}
        >
          <User className="mr-2 h-4 w-4" style={{ color: '#007AFF' }} />
          Профиль
        </DropdownMenuItem>
        <DropdownMenuSeparator style={{ background: 'var(--ios-divider)' }} />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer px-3 py-2"
          style={{ color: '#EE7070' }}
        >
          <LogOut className="mr-2 h-4 w-4" style={{ color: '#EE7070' }} />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
