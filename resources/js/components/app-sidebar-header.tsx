import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { type ReactNode } from 'react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
    title?: string;
    renderHeader?: () => ReactNode;
}

export function AppSidebarHeader({ breadcrumbs = [], title, renderHeader }: AppSidebarHeaderProps) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);

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
                    
                    // If we have unread notifications and haven't fetched full notifications yet
                    if (response.data.unreadCount > 0 && !isInitialized) {
                        fetchFullNotifications();
                    }
                }
            } catch (error) {
                console.error('Error fetching notification count:', error);
            }
        };
        
        // Function to fetch full notifications
        const fetchFullNotifications = async () => {
            try {
                const response = await axios.get('/api/notifications');
                if (response.data && Array.isArray(response.data.notifications)) {
                    setNotifications(response.data.notifications);
                    setUnreadCount(response.data.unreadCount);
                    setIsInitialized(true);
                }
            } catch (error) {
                console.error('Error fetching full notifications:', error);
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
    }, [isInitialized]);

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2 flex-1">
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
            <div className="flex items-center gap-2">
                <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            </div>
        </header>
    );
}
