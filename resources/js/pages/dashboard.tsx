import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CheckCheck,
    ClipboardList,
    MapPin,
    Receipt,
    Store,
    Wallet,
} from 'lucide-react';
import { following, notifications as notificationsRoute } from '@/routes';
import { index as ordersIndex, show as orderShow } from '@/routes/orders';
import { index as storesIndex } from '@/routes/stores';

type RecentOrder = {
    id: number;
    reference: string;
    store_name: string;
    status: string;
    status_label: string;
    total: number;
    items_count: number;
    created_at: string | null;
};

type Props = {
    stats: {
        total_orders: number;
        active_orders: number;
        completed_orders: number;
        total_spent: number;
    };
    recent_orders: RecentOrder[];
};

const STATUS_STYLES: Record<string, string> = {
    pending_payment:
        'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    preparing: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    ready_for_pickup:
        'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    out_for_delivery:
        'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    completed:
        'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    cancelled: 'bg-secondary text-muted-foreground',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
};

function formatPrice(value: number): string {
    return '₱' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function StatCard({
    label,
    value,
    icon: Icon,
    iconClass,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    iconClass: string;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}
                >
                    <Icon className="size-4" />
                </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
    );
}

export default function Dashboard({ stats, recent_orders }: Props) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Welcome, {auth.user.first_name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Find water suppliers near you and stay updated on stock.
                    </p>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-3">
                    <StatCard
                        label="Total orders"
                        value={stats.total_orders}
                        icon={Receipt}
                        iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    />
                    <StatCard
                        label="Active orders"
                        value={stats.active_orders}
                        icon={ClipboardList}
                        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                    />
                    <StatCard
                        label="Completed"
                        value={stats.completed_orders}
                        icon={CheckCheck}
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    />
                    <StatCard
                        label="Total spent"
                        value={formatPrice(stats.total_spent)}
                        icon={Wallet}
                        iconClass="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                    />
                </div>

                <div className="mb-8">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground">
                            Recent orders
                        </h2>
                        <Link
                            href={ordersIndex()}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            View all
                        </Link>
                    </div>

                    {recent_orders.length === 0 ? (
                        <div className="rounded-xl border border-border/60 py-10 text-center">
                            <Receipt className="mx-auto mb-2 size-6 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                You haven't placed any orders yet.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
                            {recent_orders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={orderShow(order.id)}
                                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-secondary/50"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {order.store_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {order.reference} ·{' '}
                                            {formatDate(order.created_at)} ·{' '}
                                            {formatPrice(order.total)}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                            STATUS_STYLES[order.status] ??
                                            'bg-secondary text-muted-foreground'
                                        }`}
                                    >
                                        {order.status_label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid gap-3">
                    <Link
                        href={storesIndex()}
                        className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <MapPin className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                                Browse suppliers
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Find nearby water suppliers on the map
                            </p>
                        </div>
                    </Link>

                    <Link
                        href={following()}
                        className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Store className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                                Following
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Stores you follow for restock alerts
                            </p>
                        </div>
                    </Link>

                    <Link
                        href={notificationsRoute()}
                        className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Bell className="size-5 text-primary" />
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                                    Notifications
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Stock alerts and updates
                                </p>
                            </div>
                            {auth.notifications_count > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                                    {auth.notifications_count > 99
                                        ? '99+'
                                        : auth.notifications_count}
                                </span>
                            )}
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
}
