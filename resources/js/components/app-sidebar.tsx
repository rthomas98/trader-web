import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Wallet, CreditCard, ArrowLeftRight, PiggyBank, LineChart, History, Briefcase, BarChart2, Shield, BookText, PenLine, ClipboardList, Users, UserPlus, UserCheck, BrainCircuit, Copy, TrendingUp, Bell, type LucideIcon } from 'lucide-react';
import AppLogo from './app-logo';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { route } from 'ziggy-js';

const mainNavItems = [
  {
    title: 'Dashboard',
    href: route('dashboard'),
    icon: LayoutGrid as LucideIcon,
  },
  {
    title: 'Analytics',
    href: route('analytics.index'),
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
        href: route('trading.index'),
        icon: LineChart as LucideIcon,
      },
      {
        title: 'Trade History',
        href: route('trading.history'),
        icon: History as LucideIcon,
      },
    ],
  },
  {
    title: 'Risk Management',
    href: route('risk-management'),
    icon: Shield as LucideIcon,
  },
  {
    title: 'Trading Journal',
    icon: BookText as LucideIcon,
    children: [
      {
        title: 'Journal Entries',
        href: route('trading-journal.index'),
        icon: BookText as LucideIcon,
      },
      {
        title: 'Create Entry',
        href: route('trading-journal.create'),
        icon: PenLine as LucideIcon,
      },
    ],
  },
  {
    title: 'Strategy Backtesting',
    href: route('strategy-backtesting.index'),
    icon: ClipboardList as LucideIcon,
  },
  {
    title: 'My Trading Strategies',
    href: route('my-strategies.index'),
    icon: BrainCircuit as LucideIcon,
  },
  {
    title: 'Social Trading',
    icon: Users as LucideIcon,
    children: [
      {
        title: 'Discover Traders',
        href: route('social.index'),
        icon: Users as LucideIcon,
      },
      {
        title: 'Following',
        href: route('social.following'),
        icon: UserPlus as LucideIcon,
      },
      {
        title: 'My Followers',
        href: route('social.followers'),
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
        href: route('copy-trading.index'),
        icon: TrendingUp as LucideIcon,
      },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell as LucideIcon,
    id: 'notifications-menu',
    children: [
      {
        title: 'All Notifications',
        href: route('notifications.settings'),
        icon: Bell as LucideIcon,
      },
      {
        title: 'Price Alerts',
        href: route('notifications.settings') + '?tab=price-alerts',
        icon: TrendingUp as LucideIcon,
      },
    ],
  },
  {
    title: 'Wallet',
    icon: Wallet as LucideIcon,
    children: [
      {
        title: 'My Wallets',
        href: route('wallets.index'),
        icon: PiggyBank as LucideIcon,
      },
      {
        title: 'Connected Accounts',
        href: route('connected-accounts.index'),
        icon: CreditCard as LucideIcon,
      },
      {
        title: 'Funding',
        href: route('funding.index'),
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
    href: 'https://laravel.com/docs',
    icon: BookOpen as LucideIcon,
  },
] as NavItem[];

export function AppSidebar() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Set up axios defaults for CSRF protection
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
      axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
    
    // Function to fetch notification count
    const fetchNotificationCount = async () => {
      try {
        const response = await axios.get('/api/notifications/count');
        if (response.data && typeof response.data.unreadCount === 'number') {
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    // Initial fetch
    fetchNotificationCount();
    
    // Set up polling for notification count (every 30 seconds)
    const countInterval = setInterval(fetchNotificationCount, 30000);
    
    // Clean up intervals on component unmount
    return () => {
      clearInterval(countInterval);
    };
  }, []);

  // Custom render function for menu items to add notification badge
  const renderMenuItem = (item: NavItem) => {
    if (item.id === 'notifications-menu' && unreadCount > 0) {
      return (
        <div className="flex items-center justify-between w-full">
          <span>{item.title}</span>
          <Badge variant="default" className="ml-2 bg-primary">{unreadCount > 9 ? '9+' : unreadCount}</Badge>
        </div>
      );
    }
    return item.title;
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={route('dashboard')} prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} renderTitle={renderMenuItem} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
