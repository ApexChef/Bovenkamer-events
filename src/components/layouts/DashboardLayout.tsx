'use client';

import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuthStore, useRegistrationStore } from '@/lib/store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();
  const { reset: resetRegistration } = useRegistrationStore();

  const handleLogout = () => {
    resetRegistration();
    logout();
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <AppSidebar
        userName={currentUser?.name || 'Deelnemer'}
        userRole={currentUser?.role}
        onLogout={handleLogout}
      />
      <SidebarInset className="bg-deep-green">
        {/* Mobile header with sidebar trigger */}
        <header className="flex h-14 items-center gap-4 border-b border-gold/20 px-4 md:hidden">
          <SidebarTrigger className="text-cream hover:text-gold hover:bg-gold/10">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          <span className="font-display text-lg text-gold">Bovenkamer</span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
