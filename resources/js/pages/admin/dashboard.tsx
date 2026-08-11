import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Receipt,
    Users,
    Wallet,
} from 'lucide-react';
import { dashboard } from '@/routes/admin';
import { index as ordersIndex } from '@/routes/admin/orders';
import { index as sellersIndex } from '@/routes/admin/sellers';

type Stats = {
    pending_approvals: number;
    approved_sellers: number;
    total_consumers: number;
    stale_stores: number;
    in_stock_stores: number;
};

type OrderStats = {
    total_orders: number;
    completed_orders: number;
    gmv: number;
    cash_orders: number;
    online_orders: number;
};

type Props = {
    stats: Stats;
    orderStats: OrderStats;
};

function formatPrice(value: number): string {
    return '₱' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function StatCard({
    label,
    value,
    icon: Icon,
    href,
    highlight,
    description,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    href?: string;
    highlight?: boolean;
    description?: string;
}) {
    const inner = (
        <div
            className={[
                'flex items-start gap-4 rounded-xl border p-5 transition-shadow',
                href ? 'cursor-pointer hover:shadow-md' : '',
                highlight && value > 0
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20'
                    : 'border-border bg-card',
            ].join(' ')}
        >
            <div
                className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    highlight && value > 0
                        ? 'bg-amber-100 dark:bg-amber-900/40'
                        : 'bg-secondary',
                ].join(' ')}
            >
                <Icon
                    className={[
                        'size-5',
                        highlight && value > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground',
                    ].join(' ')}
                />
            </div>
            <div>
                <p className="text-2xl font-semibold text-foreground tabular-nums">
                    {value}
                </p>
                <p className="text-sm font-medium text-foreground">{label}</p>
                {description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{inner}</Link>;
    }

    return inner;
}

export default function AdminDashboard({ stats, orderStats }: Props) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-8 p-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Platform overview and quick actions.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Pending approvals"
                        value={stats.pending_approvals}
                        icon={Clock}
                        href={sellersIndex.url({
                            query: { status: 'pending' },
                        })}
                        highlight
                        description="Seller applications awaiting review"
                    />
                    <StatCard
                        label="Approved sellers"
                        value={stats.approved_sellers}
                        icon={CheckCircle}
                        href={sellersIndex.url({
                            query: { status: 'approved' },
                        })}
                        description="Active stores on the platform"
                    />
                    <StatCard
                        label="Consumers"
                        value={stats.total_consumers}
                        icon={Users}
                        description="Registered consumer accounts"
                    />
                    <StatCard
                        label="Stale stores"
                        value={stats.stale_stores}
                        icon={AlertTriangle}
                        href={sellersIndex.url({
                            query: { status: 'approved' },
                        })}
                        highlight
                        description="Approved stores not updated in 7+ days"
                    />
                </div>

                <div>
                    <h2 className="mb-3 text-sm font-semibold text-foreground">
                        Orders
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Total orders"
                            value={orderStats.total_orders}
                            icon={Receipt}
                            href={ordersIndex.url()}
                            description="All orders placed on the platform"
                        />
                        <StatCard
                            label="Completed"
                            value={orderStats.completed_orders}
                            icon={CheckCircle}
                            href={ordersIndex.url({
                                query: { status: 'completed' },
                            })}
                            description="Fulfilled and closed out"
                        />
                        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                <Wallet className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground tabular-nums">
                                    {formatPrice(orderStats.gmv)}
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    GMV (paid)
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Value of paid orders
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                <Receipt className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Payment mix
                                </p>
                                <div className="mt-1 flex items-center gap-3">
                                    <div>
                                        <p className="text-lg font-semibold text-foreground tabular-nums">
                                            {orderStats.cash_orders}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            cash
                                        </p>
                                    </div>
                                    <div className="h-8 w-px bg-border" />
                                    <div>
                                        <p className="text-lg font-semibold text-foreground tabular-nums">
                                            {orderStats.online_orders}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            online
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="mb-1 text-sm font-semibold text-foreground">
                        Inventory health
                    </h2>
                    <p className="mb-4 text-xs text-muted-foreground">
                        Across all approved stores with products.
                    </p>
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-xl font-semibold text-green-700 tabular-nums dark:text-green-400">
                                {stats.in_stock_stores}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                stores with stock
                            </p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div>
                            <p className="text-xl font-semibold text-red-600 tabular-nums dark:text-red-400">
                                {Math.max(
                                    0,
                                    stats.approved_sellers -
                                        stats.in_stock_stores,
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                stores out of stock
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
