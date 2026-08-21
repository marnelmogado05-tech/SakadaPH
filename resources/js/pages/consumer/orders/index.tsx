import { Head, Link } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import OrderStatus from '@/components/order-status';
import type { OrderState } from '@/components/order-status';
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
    status: OrderState;
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
                                    <OrderStatus
                                        state={order.status}
                                        label={order.status_label}
                                    />
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
