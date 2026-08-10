import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { StarRating } from '@/components/star-rating';
import { index as ordersIndex } from '@/routes/admin/orders';

type OrderItem = {
    id: number;
    name: string;
    unit: string;
    unit_price: number;
    quantity: number;
    line_total: number;
};

type Order = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    fulfillment_type: string;
    payment_method_label: string;
    payment_status_label: string;
    gcash_reference: string | null;
    subtotal: number;
    delivery_fee: number;
    total: number;
    delivery_address: string | null;
    contact_number: string;
    notes: string | null;
    cancellation_reason: string | null;
    created_at: string | null;
    confirmed_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    store: {
        id: number;
        name: string;
        address: string;
        contact_number: string | null;
    };
    customer: {
        name: string;
        email: string;
    };
    items: OrderItem[];
    review: { rating: number; comment: string | null } | null;
};

function formatPrice(value: number): string {
    return '₱' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right text-foreground">{value}</span>
        </div>
    );
}

export default function AdminOrderShow({ order }: { order: Order }) {
    return (
        <>
            <Head title={`Order ${order.reference}`} />

            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <Link
                    href={ordersIndex()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    All orders
                </Link>

                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {order.reference}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Placed {formatDateTime(order.created_at)}
                        </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                        {order.status_label}
                    </span>
                </div>

                {order.cancellation_reason && (
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                        <p className="text-sm font-medium text-foreground">
                            Cancellation / rejection reason
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {order.cancellation_reason}
                        </p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                        <h2 className="mb-2 text-sm font-semibold text-foreground">
                            Store
                        </h2>
                        <p className="text-sm text-foreground">
                            {order.store.name}
                        </p>
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                            {order.store.address}
                        </p>
                        {order.store.contact_number && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="size-3.5 shrink-0" />
                                {order.store.contact_number}
                            </p>
                        )}
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-4">
                        <h2 className="mb-2 text-sm font-semibold text-foreground">
                            Customer
                        </h2>
                        <p className="text-sm text-foreground">
                            {order.customer.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {order.customer.email}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3.5 shrink-0" />
                            {order.contact_number}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4">
                    <h2 className="mb-3 text-sm font-semibold text-foreground">
                        Items
                    </h2>
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="text-muted-foreground">
                                    {item.name} × {item.quantity}
                                    <span className="text-muted-foreground/70">
                                        {' '}
                                        ({formatPrice(item.unit_price)}/
                                        {item.unit})
                                    </span>
                                </span>
                                <span className="text-foreground">
                                    {formatPrice(item.line_total)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                        <InfoRow
                            label="Subtotal"
                            value={formatPrice(order.subtotal)}
                        />
                        <InfoRow
                            label="Delivery fee"
                            value={formatPrice(order.delivery_fee)}
                        />
                        <div className="flex justify-between pt-1 text-base font-semibold text-foreground">
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 rounded-xl border border-border/60 bg-card p-4 text-sm">
                    <InfoRow
                        label="Payment"
                        value={`${order.payment_method_label} · ${order.payment_status_label}`}
                    />
                    {order.gcash_reference && (
                        <InfoRow
                            label="GCash reference"
                            value={order.gcash_reference}
                        />
                    )}
                    <InfoRow
                        label="Fulfillment"
                        value={order.fulfillment_type}
                    />
                    {order.delivery_address && (
                        <InfoRow
                            label="Delivery address"
                            value={order.delivery_address}
                        />
                    )}
                    {order.confirmed_at && (
                        <InfoRow
                            label="Confirmed"
                            value={formatDateTime(order.confirmed_at)}
                        />
                    )}
                    {order.completed_at && (
                        <InfoRow
                            label="Completed"
                            value={formatDateTime(order.completed_at)}
                        />
                    )}
                    {order.cancelled_at && (
                        <InfoRow
                            label="Cancelled"
                            value={formatDateTime(order.cancelled_at)}
                        />
                    )}
                    {order.notes && (
                        <p className="text-muted-foreground">
                            Notes: {order.notes}
                        </p>
                    )}
                </div>

                {order.review && (
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                        <h2 className="mb-2 text-sm font-semibold text-foreground">
                            Customer review
                        </h2>
                        <StarRating value={order.review.rating} size={16} />
                        {order.review.comment && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {order.review.comment}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

AdminOrderShow.layout = {
    breadcrumbs: [
        { title: 'Orders', href: ordersIndex() },
        { title: 'Order Details', href: ordersIndex() },
    ],
};
