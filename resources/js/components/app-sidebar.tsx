import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Wallet, CreditCard, ArrowLeftRight, PiggyBank, LineChart, History, Briefcase, BarChart2, Shield, BookText, PenLine, ClipboardList, Users, UserPlus, UserCheck, BrainCircuit, Copy, TrendingUp, type LucideIcon } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid as LucideIcon,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart2 as LucideIcon,
  },
  {
    title: 'Portfolio',
    href: '/portfolio',
    icon: Briefcase as LucideIcon,
  },
  {
    title: 'Trading',
    icon: LineChart as LucideIcon,
    children: [
      {
        title: 'Live Trading',
        href: '/trading',
        icon: LineChart as LucideIcon,
      },
      {
        title: 'Trade History',
        href: '/trading/history',
        icon: History as LucideIcon,
      },
    ],
  },
  {
    title: 'Risk Management',
    href: '/risk-management',
    icon: Shield as LucideIcon,
  },
  {
    title: 'Trading Journal',
    icon: BookText as LucideIcon,
    children: [
      {
        title: 'Journal Entries',
        href: '/trading-journal',
        icon: BookText as LucideIcon,
      },
      {
        title: 'Create Entry',
        href: '/trading-journal/create',
        icon: PenLine as LucideIcon,
      },
    ],
  },
  {
    title: 'Strategy Backtesting',
    href: '/strategy-backtesting',
    icon: ClipboardList as LucideIcon,
  },
  {
    title: 'My Trading Strategies',
    href: '/my-strategies',
    icon: BrainCircuit as LucideIcon,
  },
  {
    title: 'Social Trading',
    icon: Users as LucideIcon,
    children: [
      {
        title: 'Discover Traders',
        href: '/social',
        icon: Users as LucideIcon,
      },
      {
        title: 'Following',
        href: '/social/following',
        icon: UserPlus as LucideIcon,
      },
      {
        title: 'My Followers',
        href: '/social/followers',
        icon: UserCheck as LucideIcon,
      },
    ],
  },
  {
    title: 'Copy Trading',
    icon: Copy as LucideIcon,
    children: [
      {
        title: 'My Copy Relationships',
        href: '/copy-trading',
        icon: TrendingUp as LucideIcon,
      },
    ],
  },
  {
    title: 'Wallet',
    href: '/wallets',
    icon: Wallet as LucideIcon,
    children: [
      {
        title: 'My Wallets',
        href: '/wallets',
        icon: PiggyBank as LucideIcon,
      },
      {
        title: 'Connected Accounts',
        href: '/connected-accounts',
        icon: CreditCard as LucideIcon,
      },
      {
        title: 'Funding',
        href: '/funding',
        icon: ArrowLeftRight as LucideIcon,
      },
    ],
  },
] as NavItem[];

const footerNavItems = [
  {
    title: 'Repository',
    href: 'https://github.com/laravel/react-starter-kit',
    icon: Folder as LucideIcon,
  },
  {
    title: 'Documentation',
    href: 'https://laravel.com/docs/starter-kits',
    icon: BookOpen as LucideIcon,
  },
] as NavItem[];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
