import { Deferred, Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Receipt,
    Users,
    Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

type StaleStore = { id: number; name: string; address: string };

type Attention = {
    pending_approvals: number;
    stale_count: number;
    stale_stores: StaleStore[];
};

type Props = {
    attention: Attention;
    stats: Stats;
    /** Deferred — absent until the follow-up request resolves. */
    orderStats?: OrderStats;
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
                    ? 'border-attention/40 bg-attention-wash'
                    : 'border-border bg-card',
            ].join(' ')}
        >
            <div
                className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    highlight && value > 0
                        ? 'bg-attention-wash'
                        : 'bg-secondary',
                ].join(' ')}
            >
                <Icon
                    className={[
                        'size-5',
                        highlight && value > 0
                            ? 'text-attention'
                            : 'text-muted-foreground',
                    ].join(' ')}
                />
            </div>
            <div>
                <p className="font-display text-2xl font-bold text-foreground tabular-nums">
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

/**
 * Leads the dashboard with whatever is waiting on a person, and renders nothing
 * when both queues are clear — a proud zero is not worth the space.
 */
function NeedsYou({ attention }: { attention: Attention }) {
    const approvals = attention.pending_approvals;
    const stale = attention.stale_count;

    if (approvals === 0 && stale === 0) {
        return null;
    }

    return (
        <section className="rounded-xl border border-attention/40 bg-attention-wash p-5">
            <h2 className="font-display text-sm font-bold tracking-wide text-attention uppercase">
                Needs you
            </h2>

            <div className="mt-3 space-y-3">
                {approvals > 0 && (
                    <Link
                        href={sellersIndex.url({
                            query: { status: 'pending' },
                        })}
                        className="flex min-h-11 items-center gap-3 text-sm text-foreground hover:underline"
                    >
                        <Clock className="size-4 shrink-0 text-attention" />
                        <span>
                            <span className="font-display font-bold tabular-nums">
                                {approvals}
                            </span>{' '}
                            seller application{approvals === 1 ? '' : 's'}{' '}
                            waiting for review
                        </span>
                    </Link>
                )}

                {stale > 0 && (
                    <div>
                        <p className="flex items-center gap-3 text-sm text-foreground">
                            <AlertTriangle className="size-4 shrink-0 text-attention" />
                            <span>
                                <span className="font-display font-bold tabular-nums">
                                    {stale}
                                </span>{' '}
                                approved store{stale === 1 ? '' : 's'} have not
                                touched stock in 7 days
                            </span>
                        </p>
                        <ul className="mt-1 ml-7">
                            {attention.stale_stores.map((store) => (
                                <li key={store.id}>
                                    <Link
                                        href={sellersIndex.url({
                                            query: { search: store.name },
                                        })}
                                        className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground hover:underline"
                                    >
                                        {store.name}
                                        <span className="text-xs text-muted-foreground">
                                            {store.address}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                            {stale > attention.stale_stores.length && (
                                <li className="text-xs text-muted-foreground">
                                    and {stale - attention.stale_stores.length}{' '}
                                    more
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}

function OrderTotals({ orderStats }: { orderStats: OrderStats }) {
    return (
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
                    <p className="font-display text-2xl font-bold text-foreground tabular-nums">
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
    );
}

function OrderTotalsSkeleton() {
    return (
        <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-busy="true"
            aria-live="polite"
        >
            <span className="sr-only">Loading order totals</span>
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
                >
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="flex-1">
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="mt-2 h-4 w-24" />
                        <Skeleton className="mt-1.5 h-3 w-32" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AdminDashboard({
    attention,
    stats,
    orderStats,
}: Props) {
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

                <NeedsYou attention={attention} />

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
                    <Deferred
                        data="orderStats"
                        fallback={<OrderTotalsSkeleton />}
                    >
                        {orderStats ? (
                            <OrderTotals orderStats={orderStats} />
                        ) : null}
                    </Deferred>
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
                            <p className="font-display text-xl font-bold text-stock-full tabular-nums">
                                {stats.in_stock_stores}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                stores with stock
                            </p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div>
                            <p className="font-display text-xl font-bold text-stock-empty tabular-nums">
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
