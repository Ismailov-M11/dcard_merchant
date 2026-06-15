import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';
import { PageTransition } from '@/components/PageTransition';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ios-bg)' }}>
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '14px',
            background: 'var(--ios-card)',
            border: '1px solid var(--ios-border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            color: 'var(--ios-text-primary)',
          },
        }}
      />
    </div>
  );
}
