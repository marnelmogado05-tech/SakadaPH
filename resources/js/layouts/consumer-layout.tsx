import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Heart,
    LayoutGrid,
    LogOut,
    Receipt,
    Settings,
    ShoppingCart,
    Store,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    dashboard,
    following,
    logout,
    notifications as notificationsRoute,
} from '@/routes';
import { index as cartIndex } from '@/routes/cart';
import { index as ordersIndex } from '@/routes/orders';
import { edit as profileEdit } from '@/routes/profile';
import { index as storesIndex } from '@/routes/stores';

function NavItem({
    href,
    icon: Icon,
    label,
    active,
    badge,
}: {
    href: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            <div className="relative">
                <Icon
                    className={`size-5 ${active ? 'stroke-[2.2px]' : 'stroke-[1.7px]'}`}
                />
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </div>
            <span className={active ? 'font-medium' : ''}>{label}</span>
        </Link>
    );
}

function initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function ConsumerLayout({ children }: PropsWithChildren) {
    const page = usePage();
    const { auth } = page.props;
    const currentComponent = page.component;

    const user = auth.user;
    const userInitials = initials(user.first_name, user.last_name);
    const fullName = `${user.first_name} ${user.last_name}`.trim();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
                <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
                    <Link
                        href={dashboard().url}
                        className="flex items-center gap-2"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                            <AppLogoIcon className="size-8 object-contain" />
                        </div>
                        <span className="text-base font-semibold tracking-tight text-foreground">
                            Sakada PH
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href={cartIndex().url}
                            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label="Cart"
                        >
                            <ShoppingCart className="size-5" />
                            {auth.cart_count > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                                    {auth.cart_count > 99
                                        ? '99+'
                                        : auth.cart_count}
                                </span>
                            )}
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                                    aria-label="User menu"
                                >
                                    {userInitials}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="font-normal">
                                    <p className="text-sm font-semibold text-foreground">
                                        {fullName}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={ordersIndex().url}
                                        className="flex items-center gap-2"
                                    >
                                        <Receipt className="size-4" />
                                        My orders
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={profileEdit().url}
                                        className="flex items-center gap-2"
                                    >
                                        <Settings className="size-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                                    onSelect={() => router.post(logout().url)}
                                >
                                    <LogOut className="size-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="flex-1 pb-20">{children}</main>

            <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur">
                <div className="mx-auto flex max-w-2xl items-stretch px-2">
                    <NavItem
                        href={dashboard().url}
                        icon={LayoutGrid}
                        label="Home"
                        active={currentComponent === 'dashboard'}
                    />
                    <NavItem
                        href={ordersIndex().url}
                        icon={Receipt}
                        label="Orders"
                        active={currentComponent.startsWith('consumer/orders')}
                    />
                    <NavItem
                        href={storesIndex().url}
                        icon={Store}
                        label="Stores"
                        active={
                            currentComponent === 'stores/index' ||
                            currentComponent === 'stores/show'
                        }
                    />
                    <NavItem
                        href={following().url}
                        icon={Heart}
                        label="Following"
                        active={currentComponent === 'stores/following'}
                    />
                    <NavItem
                        href={notificationsRoute().url}
                        icon={Bell}
                        label="Alerts"
                        active={currentComponent === 'notifications'}
                        badge={auth.notifications_count}
                    />
                </div>
            </nav>
        </div>
    );
}
