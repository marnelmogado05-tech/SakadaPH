import { Head, Link } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { show as orderShow } from '@/routes/orders';
import { index as storesIndex } from '@/routes/stores';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type OrderRow = {
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
    orders: {
        data: OrderRow[];
        last_page: number;
        links: PaginationLink[];
    };
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

export default function OrdersIndex({ orders }: Props) {
    return (
        <>
            <Head title="My orders" />

            <div className="mx-auto max-w-2xl px-4 py-6">
                <h1 className="mb-6 text-lg font-semibold tracking-tight text-foreground">
                    My orders
                </h1>

                {orders.data.length === 0 ? (
                    <div className="rounded-xl border border-border/60 py-16 text-center">
                        <Receipt className="mx-auto mb-3 size-8 text-muted-foreground" />
                        <p className="mb-4 text-sm text-muted-foreground">
                            You haven't placed any orders yet.
                        </p>
                        <Button asChild>
                            <Link href={storesIndex()}>Browse suppliers</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.data.map((order) => (
                            <Link
                                key={order.id}
                                href={orderShow(order.id)}
                                className="block rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {order.store_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {order.reference} ·{' '}
                                            {order.items_count} item
                                            {order.items_count === 1
                                                ? ''
                                                : 's'}{' '}
                                            · {formatDate(order.created_at)}
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
                                </div>
                                <p className="mt-2 text-sm font-semibold text-foreground">
                                    {formatPrice(order.total)}
                                </p>
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
