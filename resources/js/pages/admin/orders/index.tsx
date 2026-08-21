import { Head, Link, router } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import { useRef, useState } from 'react';
import OrderStatus from '@/components/order-status';
import type { OrderState } from '@/components/order-status';
import { Input } from '@/components/ui/input';
import { index as ordersIndex, show as orderShow } from '@/routes/admin/orders';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type OrderRow = {
    id: number;
    reference: string;
    store_name: string;
    customer_name: string;
    status: OrderState;
    status_label: string;
    payment_method: string;
    payment_status: string;
    total: number;
    created_at: string | null;
};

type Filters = {
    search: string;
    status: string;
    date_from: string;
    date_to: string;
};

type Props = {
    orders: {
        data: OrderRow[];
        last_page: number;
        links: PaginationLink[];
    };
    filters: Filters;
    statusOptions: { value: string; label: string }[];
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
        year: 'numeric',
    });
}

export default function AdminOrdersIndex({
    orders,
    filters,
    statusOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    function applyFilter(overrides: Partial<Filters> = {}) {
        router.get(
            ordersIndex(),
            {
                search: (overrides.search ?? search) || undefined,
                status:
                    (overrides.status !== undefined
                        ? overrides.status
                        : filters.status) || undefined,
                date_from:
                    (overrides.date_from !== undefined
                        ? overrides.date_from
                        : filters.date_from) || undefined,
                date_to:
                    (overrides.date_to !== undefined
                        ? overrides.date_to
                        : filters.date_to) || undefined,
            },
            { preserveScroll: true, replace: true, preserveState: true },
        );
    }

    function handleSearch(value: string) {
        setSearch(value);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(
            () => applyFilter({ search: value }),
            350,
        );
    }

    return (
        <>
            <Head title="Orders" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">
                        Orders
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Read-only view of every order across the platform.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                        placeholder="Search reference, store, customer…"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <select
                        value={filters.status}
                        onChange={(e) =>
                            applyFilter({ status: e.target.value })
                        }
                        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                    >
                        <option value="">All statuses</option>
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <Input
                        type="date"
                        aria-label="From date"
                        value={filters.date_from}
                        onChange={(e) =>
                            applyFilter({ date_from: e.target.value })
                        }
                    />
                    <Input
                        type="date"
                        aria-label="To date"
                        value={filters.date_to}
                        onChange={(e) =>
                            applyFilter({ date_to: e.target.value })
                        }
                    />
                </div>

                {orders.data.length === 0 ? (
                    <div className="rounded-xl border border-border/60 py-16 text-center">
                        <Receipt className="mx-auto mb-3 size-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            No orders match these filters.
                        </p>
                        <Link
                            href={ordersIndex()}
                            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                            Clear filters
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                        <div className="divide-y divide-border/60">
                            {orders.data.map((order) => (
                                <Link
                                    key={order.id}
                                    href={orderShow(order.id)}
                                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-secondary/40"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground">
                                            {order.reference}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {order.store_name} ·{' '}
                                            {order.customer_name} ·{' '}
                                            {order.payment_method} ·{' '}
                                            {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <OrderStatus
                                            state={order.status}
                                            label={order.status_label}
                                        />
                                        <span className="text-sm font-semibold text-foreground">
                                            {formatPrice(order.total)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {orders.last_page > 1 && (
                    <div className="flex items-center gap-1">
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

AdminOrdersIndex.layout = {
    breadcrumbs: [{ title: 'Orders', href: ordersIndex() }],
};
