import { Link, usePage } from '@inertiajs/react';
import { Bell, LayoutGrid, Package, Receipt, Store } from 'lucide-react';
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
import { dashboard } from '@/routes/seller';
import { index as ordersIndex } from '@/routes/seller/orders';
import { index as productsIndex } from '@/routes/seller/products';
import { edit as storeEdit } from '@/routes/seller/store';
import type { NavItem } from '@/types';

export function SellerSidebar() {
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
            badge: auth.seller_pending_orders_count,
        },
        {
            title: 'Products',
            href: productsIndex(),
            icon: Package,
        },
        {
            title: 'Store details',
            href: storeEdit(),
            icon: Store,
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
