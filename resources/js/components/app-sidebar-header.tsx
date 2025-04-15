import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { type ReactNode } from 'react';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
    title?: string;
    renderHeader?: () => ReactNode;
}

export function AppSidebarHeader({ breadcrumbs = [], title, renderHeader }: AppSidebarHeaderProps) {
    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2 w-full">
                <SidebarTrigger className="-ml-1" />
                {renderHeader ? (
                    renderHeader()
                ) : (
                    <>
                        {title && <h1 className="text-xl font-semibold mr-4">{title}</h1>}
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </>
                )}
            </div>
        </header>
    );
}
