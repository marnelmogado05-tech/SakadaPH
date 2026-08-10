import { Link, usePage } from '@inertiajs/react';
import { Bell, LayoutGrid, Receipt, Store, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { notifications as notificationsRoute } from '@/routes';
import { dashboard } from '@/routes/admin';
import { index as ordersIndex } from '@/routes/admin/orders';
import { index as sellersIndex } from '@/routes/admin/sellers';
import { index as usersIndex } from '@/routes/admin/users';
import type { NavItem } from '@/types';

export function AdminSidebar() {
    const { auth } = usePage().props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Orders',
            href: ordersIndex(),
            icon: Receipt,
        },
        {
            title: 'Sellers',
            href: sellersIndex(),
            icon: Store,
        },
        {
            title: 'Users',
            href: usersIndex(),
            icon: Users,
        },
        {
            title: 'Notifications',
            href: notificationsRoute(),
            icon: Bell,
            badge: auth.notifications_count,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
