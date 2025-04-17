import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Toaster } from '@/components/ui/sonner';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, type ReactNode } from 'react';

interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    title?: string;
    renderHeader?: () => ReactNode;
}

export default function AppSidebarLayout({ 
    children, 
    breadcrumbs = [],
    title,
    renderHeader
}: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} title={title} renderHeader={renderHeader} />
                <div className="">
                    {children}
                </div>
            </AppContent>
            <Toaster />
        </AppShell>
    );
}
