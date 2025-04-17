import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export type User = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    onboarding_completed: boolean;
    risk_tolerance_level: 'conservative' | 'moderate' | 'aggressive';
    risk_percentage: number;
    max_drawdown_percentage: number;
    trading_account_type: 'DEMO' | 'LIVE';
    demo_mode_enabled: boolean;
};

export interface Auth {
    user: User;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
    ziggy: Config & { location: string };
}

export type Breadcrumb = {
    label: string;
    url?: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}
