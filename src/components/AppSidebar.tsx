'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BarChart3,
  Trophy,
  User,
  LogOut,
  Flame,
  Gamepad2,
  LayoutDashboard,
  UtensilsCrossed,
  BookOpen,
  ChefHat,
  Package,
  Users,
  CreditCard,
  ClipboardList,
  FileText,
  Target,
  Star,
  UserCheck,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useFeatures } from '@/components/FeatureProvider';
import { FeatureKey } from '@/types';

interface AppSidebarProps {
  userName: string;
  userRole?: string;
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  featureKey?: FeatureKey; // Optional feature toggle
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/eten-drinken', label: 'Eten & Drinken', icon: UtensilsCrossed },
  { href: '/menu', label: 'Menu', icon: BookOpen, featureKey: 'show_menu' },
  { href: '/predictions', label: 'Voorspellingen', icon: BarChart3, featureKey: 'show_predictions' },
  { href: '/leaderboard', label: 'Ranking', icon: Trophy, featureKey: 'show_live_ranking' },
  { href: '/game', label: 'Burger Game', icon: Gamepad2, featureKey: 'show_burger_game' },
  { href: '/profile', label: 'Profiel', icon: User },
];

interface AdminGroup {
  label: string;
  items: NavItem[];
}

const adminGroups: AdminGroup[] = [
  {
    label: 'Event & Menu',
    items: [
      { href: '/admin/menu', label: 'Menu Beheer', icon: ChefHat },
      { href: '/admin/purchase-orders', label: 'Inkooporders', icon: Package },
      { href: '/admin/fb-rapport', label: 'F&B Rapport', icon: BarChart3 },
    ],
  },
  {
    label: 'Deelnemers & Activiteit',
    items: [
      { href: '/admin/gebruikers', label: 'Gebruikersbeheer', icon: Users },
      { href: '/admin/deelnemers', label: 'Deelnemers', icon: UserCheck },
      { href: '/admin/payments', label: 'Betalingen', icon: CreditCard },
      { href: '/admin/registraties', label: 'Registraties', icon: ClipboardList },
      { href: '/admin/formulieren', label: 'Formulieren', icon: FileText },
    ],
  },
  {
    label: 'Entertainment',
    items: [
      { href: '/admin/quiz', label: 'Quiz Beheer', icon: Trophy },
      { href: '/admin/predictions', label: 'Voorspellingen', icon: Target },
      { href: '/admin/ratings', label: 'Beoordelingen', icon: Star },
    ],
  },
];

export function AppSidebar({ userName, userRole, onLogout }: AppSidebarProps) {
  const pathname = usePathname();
  const { isEnabled } = useFeatures();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Filter nav items based on feature toggles
  const visibleNavItems = mainNavItems.filter(item => {
    // If no feature key, always show
    if (!item.featureKey) return true;
    // Otherwise check if feature is enabled
    return isEnabled(item.featureKey);
  });

  return (
    <Sidebar className="border-r border-gold/20 bg-dark-wood">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-gold/20 p-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 text-dark-wood" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl text-gold leading-tight">Bovenkamer</span>
            <span className="text-xs text-cream/40 uppercase tracking-wider">Winterproef</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-cream/50 uppercase text-xs tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className="text-cream/70 hover:text-cream hover:bg-gold/10 data-[active=true]:bg-gold/20 data-[active=true]:text-gold"
                  >
                    <Link href={item.href}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {userRole === 'admin' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-cream/50 uppercase text-xs tracking-wider">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/admin'}
                      className="text-cream/70 hover:text-cream hover:bg-gold/10 data-[active=true]:bg-gold/20 data-[active=true]:text-gold"
                    >
                      <Link href="/admin">
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {adminGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="text-cream/50 uppercase text-xs tracking-wider">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          className="text-cream/70 hover:text-cream hover:bg-gold/10 data-[active=true]:bg-gold/20 data-[active=true]:text-gold"
                        >
                          <Link href={item.href}>
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </>
        )}
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t border-gold/20 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-cream truncate">{userName}</p>
            <p className="text-xs text-cream/50 capitalize">{userRole || 'Deelnemer'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-warm-red/80 hover:text-warm-red hover:bg-warm-red/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Uitloggen</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
