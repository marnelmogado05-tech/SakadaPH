import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { StarRating } from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    advance as orderAdvance,
    confirm as orderConfirm,
    index as ordersIndex,
    markPaid as orderMarkPaid,
    reject as orderReject,
} from '@/routes/seller/orders';

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
    payment_method: string;
    payment_method_label: string;
    payment_status: string;
    payment_status_label: string;
    gcash_reference: string | null;
    subtotal: number;
    delivery_fee: number;
    total: number;
    delivery_address: string | null;
    contact_number: string;
    notes: string | null;
    cancellation_reason: string | null;
    customer_name: string;
    created_at: string | null;
    confirmed_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    items: OrderItem[];
    can_confirm: boolean;
    can_reject: boolean;
    next_status: string | null;
    next_status_label: string | null;
    can_mark_paid: boolean;
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
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function SellerOrderShow({ order }: { order: Order }) {
    const [rejectOpen, setRejectOpen] = useState(false);
    const {
        data,
        setData,
        post,
        processing: rejecting,
        errors,
        reset,
    } = useForm<{ reason: string }>({ reason: '' });

    const hasActions =
        order.can_confirm ||
        order.next_status !== null ||
        order.can_mark_paid ||
        order.can_reject;

    function confirmReject() {
        post(orderReject(order.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectOpen(false);
                reset();
            },
        });
    }

    return (
        <>
            <Head title={`Order ${order.reference}`} />

            <div className="mx-auto max-w-2xl px-4 py-6">
                <Link
                    href={ordersIndex()}
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    All orders
                </Link>

                <div className="mb-6 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {order.reference}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {order.customer_name} ·{' '}
                            {formatDateTime(order.created_at)}
                        </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                        {order.status_label}
                    </span>
                </div>

                {order.cancellation_reason && (
                    <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
                        <p className="text-sm font-medium text-foreground">
                            Reason
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {order.cancellation_reason}
                        </p>
                    </div>
                )}

                <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
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
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Subtotal
                            </span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Delivery fee
                            </span>
                            <span>{formatPrice(order.delivery_fee)}</span>
                        </div>
                        <div className="flex justify-between pt-1 text-base font-semibold text-foreground">
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid gap-3 rounded-xl border border-border/60 bg-card p-4 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Payment</span>
                        <span className="text-foreground">
                            {order.payment_method_label} ·{' '}
                            {order.payment_status_label}
                        </span>
                    </div>
                    {order.payment_method === 'gcash' && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                GCash reference
                            </span>
                            <span className="text-foreground">
                                {order.gcash_reference ?? (
                                    <span className="text-muted-foreground italic">
                                        awaiting customer
                                    </span>
                                )}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                            Fulfillment
                        </span>
                        <span className="text-foreground capitalize">
                            {order.fulfillment_type}
                        </span>
                    </div>
                    {order.delivery_address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="mt-0.5 size-4 shrink-0" />
                            <span>{order.delivery_address}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4 shrink-0" />
                        <span>{order.contact_number}</span>
                    </div>
                    {order.notes && (
                        <p className="text-muted-foreground">
                            Notes: {order.notes}
                        </p>
                    )}
                </div>

                {order.review && (
                    <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
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

                {hasActions && (
                    <div className="flex flex-col gap-3">
                        {order.can_confirm && (
                            <Button
                                onClick={() =>
                                    router.post(
                                        orderConfirm(order.id).url,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Confirm order
                            </Button>
                        )}

                        {order.next_status && (
                            <Button
                                onClick={() =>
                                    router.post(
                                        orderAdvance(order.id).url,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Mark {order.next_status_label}
                            </Button>
                        )}

                        {order.can_mark_paid && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.post(
                                        orderMarkPaid(order.id).url,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {order.payment_method === 'gcash'
                                    ? 'Confirm GCash payment received'
                                    : 'Mark cash payment received'}
                            </Button>
                        )}

                        {order.can_reject && (
                            <Button
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setRejectOpen(true)}
                            >
                                Reject order
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject this order?</DialogTitle>
                        <DialogDescription>
                            Tell the customer why you can't fulfill this order.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Textarea
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="Reason for rejection"
                            className="min-h-20"
                        />
                        <InputError message={errors.reason} />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setRejectOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={rejecting}
                            onClick={confirmReject}
                        >
                            Reject order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

SellerOrderShow.layout = {
    breadcrumbs: [
        { title: 'Orders', href: ordersIndex() },
        { title: 'Order Details', href: ordersIndex() },
    ],
};
