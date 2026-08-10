import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    ClipboardList,
    Package,
    Star,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { StarRating } from '@/components/star-rating';
import { dashboard } from '@/routes/seller';
import { index as ordersIndex } from '@/routes/seller/orders';
import { index as productsIndex } from '@/routes/seller/products';

type Product = {
    id: number;
    name: string;
    availability: string;
    price: number;
    unit: string;
    last_updated_at: string | null;
};

type Props = {
    store: {
        name: string;
        status: string;
        type: string | null;
        followers_count: number;
    };
    stats: {
        total_products: number;
        in_stock: number;
        low_stock: number;
        out_of_stock: number;
    };
    orderStats: {
        pending: number;
        today: number;
        revenue: number;
    };
    rating: {
        average: number | null;
        count: number;
    };
    recent_products: Product[];
};

function formatPrice(value: number): string {
    return '₱' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const AVAILABILITY_STYLES: Record<string, string> = {
    in_stock:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    low_stock:
        'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    out_of_stock: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const AVAILABILITY_LABELS: Record<string, string> = {
    in_stock: 'In stock',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock',
};

function StatCard({
    label,
    value,
    icon: Icon,
    iconClass,
}: {
    label: string;
    value: number;
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

export default function SellerDashboard({
    store,
    stats,
    orderStats,
    rating,
    recent_products,
}: Props) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">
                        {store.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Here's an overview of your store.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total products"
                        value={stats.total_products}
                        icon={Package}
                        iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    />
                    <StatCard
                        label="In stock"
                        value={stats.in_stock}
                        icon={TrendingUp}
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    />
                    <StatCard
                        label="Low stock"
                        value={stats.low_stock}
                        icon={AlertTriangle}
                        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                    />
                    <StatCard
                        label="Out of stock"
                        value={stats.out_of_stock}
                        icon={TrendingDown}
                        iconClass="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                    />
                </div>

                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground">
                            Orders
                        </h2>
                        <Link
                            href={ordersIndex()}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            View orders
                        </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard
                            label="Pending orders"
                            value={orderStats.pending}
                            icon={ClipboardList}
                            iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                        />
                        <StatCard
                            label="Orders today"
                            value={orderStats.today}
                            icon={CalendarDays}
                            iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        />
                        <div className="rounded-xl border border-border/60 bg-card p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Revenue (paid)
                                </p>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                                    <Wallet className="size-4" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {formatPrice(orderStats.revenue)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-card p-5">
                        <div className="mb-1 flex items-center gap-2">
                            <Users className="size-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">
                                Store followers
                            </p>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            {store.followers_count}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Consumers following your store for restock alerts
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-5">
                        <div className="mb-1 flex items-center gap-2">
                            <Star className="size-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">
                                Customer rating
                            </p>
                        </div>
                        {rating.average !== null ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold text-foreground">
                                        {rating.average.toFixed(1)}
                                    </p>
                                    <StarRating
                                        value={Math.round(rating.average)}
                                        size={16}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    From {rating.count} review
                                    {rating.count === 1 ? '' : 's'}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-muted-foreground">
                                    —
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    No reviews yet
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground">
                            Recent products
                        </h2>
                        <Link
                            href={productsIndex()}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            View all
                        </Link>
                    </div>

                    {recent_products.length === 0 ? (
                        <div className="rounded-xl border border-border/60 py-10 text-center">
                            <Package className="mx-auto mb-2 size-6 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No products yet.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
                            {recent_products.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between gap-4 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            ₱{product.price.toFixed(2)} /{' '}
                                            {product.unit}
                                            {product.last_updated_at && (
                                                <span className="ml-2 text-muted-foreground/60">
                                                    · {product.last_updated_at}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                            AVAILABILITY_STYLES[
                                                product.availability
                                            ] ?? ''
                                        }`}
                                    >
                                        {AVAILABILITY_LABELS[
                                            product.availability
                                        ] ?? product.availability}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

SellerDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
