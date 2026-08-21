import { Link, usePage } from '@inertiajs/react';
import { Bell, LayoutGrid, Package, Receipt, Store } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { notifications as notificationsRoute } from '@/routes';
import { dashboard } from '@/routes/seller';
import { index as ordersIndex } from '@/routes/seller/orders';
import { index as productsIndex } from '@/routes/seller/products';
import { edit as storeEdit } from '@/routes/seller/store';

type Tab = {
    href: string;
    icon: React.ElementType;
    label: string;
    isActive: (component: string) => boolean;
    badge?: number;
};

function NavTab({ tab, active }: { tab: Tab; active: boolean }) {
    const Icon = tab.icon;

    return (
        <Link
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            <span className="relative">
                <Icon
                    className={`size-5 ${active ? 'stroke-[2.2px]' : 'stroke-[1.7px]'}`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-attention px-1 text-[9px] font-bold text-background">
                        {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                )}
            </span>
            <span className={active ? 'font-medium' : ''}>{tab.label}</span>
        </Link>
    );
}

/**
 * Sellers run their day from a phone, often mid-task. Below `lg` they get the
 * same persistent bottom navigation the consumer app uses, rather than a
 * desktop sidebar hidden behind a hamburger. The sidebar remains the layout
 * from `lg` up, where there is room for it.
 */
export function SellerMobileNav() {
    const page = usePage();
    const { auth } = page.props;
    const component = page.component;

    const tabs: Tab[] = [
        {
            href: dashboard().url,
            icon: LayoutGrid,
            label: 'Home',
            isActive: (c) => c === 'seller/dashboard',
        },
        {
            href: ordersIndex().url,
            icon: Receipt,
            label: 'Orders',
            isActive: (c) => c.startsWith('seller/orders'),
            badge: auth.seller_pending_orders_count,
        },
        {
            href: productsIndex().url,
            icon: Package,
            label: 'Products',
            isActive: (c) => c.startsWith('seller/products'),
        },
        {
            href: storeEdit().url,
            icon: Store,
            label: 'Store',
            isActive: (c) => c === 'seller/store',
        },
        {
            href: notificationsRoute().url,
            icon: Bell,
            label: 'Alerts',
            isActive: (c) => c === 'notifications',
            badge: auth.notifications_count,
        },
    ];

    return (
        <nav
            aria-label="Seller sections"
            className="fixed right-0 bottom-0 left-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur lg:hidden"
        >
            <div className="mx-auto flex max-w-2xl items-stretch px-2">
                {tabs.map((tab) => (
                    <NavTab
                        key={tab.label}
                        tab={tab}
                        active={tab.isActive(component)}
                    />
                ))}
            </div>
        </nav>
    );
}

/**
 * Below `lg` the sidebar is gone, and with it the account menu that lived in
 * its footer — so it moves here.
 */
export function SellerMobileHeader() {
    const { auth } = usePage().props;
    const getInitials = useInitials();

    return (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
                <Link
                    href={dashboard().url}
                    className="flex items-center gap-2"
                >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                        <AppLogoIcon className="size-8 object-contain" />
                    </span>
                    <span className="font-display text-base font-bold tracking-tight text-foreground">
                        Sakada PH
                    </span>
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label="Account menu"
                            className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                        >
                            {getInitials(
                                `${auth.user.first_name} ${auth.user.last_name}`,
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
