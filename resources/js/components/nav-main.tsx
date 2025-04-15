import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarCollapsible } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    
    const renderNavItem = (item: NavItem) => {
        const isActive = page.url.startsWith(item.href);
        
        // If the item has children, render a collapsible menu
        if (item.children && item.children.length > 0) {
            return (
                <SidebarCollapsible
                    key={item.title}
                    trigger={
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                {item.icon && <item.icon className="h-4 w-4" />}
                                <span>{item.title}</span>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    }
                    open={isActive}
                >
                    <div className="pl-6 pt-2">
                        {item.children.map((child: NavItem) => (
                            <SidebarMenuItem key={child.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={child.href === page.url}
                                    tooltip={{ children: child.title }}
                                >
                                    <Link href={child.href} prefetch>
                                        {child.icon && <child.icon className="h-4 w-4" />}
                                        <span>{child.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </div>
                </SidebarCollapsible>
            );
        }
        
        // Otherwise, render a regular menu item
        return (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton  
                    asChild
                    isActive={item.href === page.url}
                    tooltip={{ children: item.title }}
                >
                    <Link href={item.href} prefetch>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };
    
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map(renderNavItem)}
            </SidebarMenu>
        </SidebarGroup>
    );
}
