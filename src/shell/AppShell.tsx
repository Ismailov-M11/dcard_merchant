import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 2, 42, 0.90)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(78, 164, 204, 0.18)',
            color: 'rgba(255,255,255,0.92)',
            borderRadius: '1rem',
          },
        }}
      />
    </div>
  );
}
