import { Head, Link } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import Heading from '@/components/heading';
import { index as ordersIndex, show as orderShow } from '@/routes/seller/orders';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type OrderRow = {
    id: number;
    reference: string;
    customer_name: string;
    status: string;
    status_label: string;
    fulfillment_type: string;
    payment_status: string;
    total: number;
    items_count: number;
    created_at: string | null;
};

type Props = {
    orders: {
        data: OrderRow[];
        last_page: number;
        links: PaginationLink[];
    };
    filters: { status: string };
    statusCounts: {
        all: number;
        pending: number;
        confirmed: number;
        preparing: number;
    };
};

const STATUS_STYLES: Record<string, string> = {
    pending_payment: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    preparing: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    ready_for_pickup: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    out_for_delivery: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    completed: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
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

    return new Date(value).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function FilterTab({
    label,
    count,
    status,
    active,
}: {
    label: string;
    count: number;
    status: string;
    active: boolean;
}) {
    return (
        <Link
            href={
                status
                    ? ordersIndex({ query: { status } })
                    : ordersIndex()
            }
            className={[
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active
                    ? 'bg-primary text-white'
                    : 'border border-border bg-background text-muted-foreground hover:text-foreground',
            ].join(' ')}
        >
            {label}
            <span
                className={`rounded-full px-1.5 text-xs ${
                    active ? 'bg-white/20' : 'bg-secondary'
                }`}
            >
                {count}
            </span>
        </Link>
    );
}

export default function SellerOrdersIndex({
    orders,
    filters,
    statusCounts,
}: Props) {
    return (
        <>
            <Head title="Orders" />

            <div className="px-4 py-6">
                <Heading
                    title="Orders"
                    description="Manage incoming orders from customers"
                />

                <div className="mb-5 flex flex-wrap gap-2">
                    <FilterTab
                        label="All"
                        count={statusCounts.all}
                        status=""
                        active={filters.status === ''}
                    />
                    <FilterTab
                        label="Pending"
                        count={statusCounts.pending}
                        status="pending"
                        active={filters.status === 'pending'}
                    />
                    <FilterTab
                        label="Confirmed"
                        count={statusCounts.confirmed}
                        status="confirmed"
                        active={filters.status === 'confirmed'}
                    />
                    <FilterTab
                        label="Preparing"
                        count={statusCounts.preparing}
                        status="preparing"
                        active={filters.status === 'preparing'}
                    />
                </div>

                {orders.data.length === 0 ? (
                    <div className="rounded-xl border border-border/60 py-16 text-center">
                        <Receipt className="mx-auto mb-3 size-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            No orders here yet.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
                        {orders.data.map((order) => (
                            <Link
                                key={order.id}
                                href={orderShow(order.id)}
                                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-secondary/40"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            {order.reference}
                                        </p>
                                        {order.payment_status === 'paid' && (
                                            <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                                                Paid
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {order.customer_name} ·{' '}
                                        {order.items_count} item
                                        {order.items_count === 1 ? '' : 's'} ·{' '}
                                        {order.fulfillment_type} ·{' '}
                                        {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            STATUS_STYLES[order.status] ??
                                            'bg-secondary text-muted-foreground'
                                        }`}
                                    >
                                        {order.status_label}
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {formatPrice(order.total)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {orders.last_page > 1 && (
                    <div className="mt-6 flex items-center gap-1">
                        {orders.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={[
                                    'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2.5 text-xs font-medium transition-colors',
                                    link.active
                                        ? 'bg-primary text-white'
                                        : link.url
                                          ? 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                          : 'cursor-default text-muted-foreground/40',
                                ].join(' ')}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveState
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

SellerOrdersIndex.layout = {
    breadcrumbs: [{ title: 'Orders', href: ordersIndex() }],
};
