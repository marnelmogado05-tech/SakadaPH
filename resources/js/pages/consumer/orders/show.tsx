import { Head, Link, useForm } from '@inertiajs/react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    cancel as orderCancel,
    gcashReference as orderGcashReference,
    index as ordersIndex,
    review as orderReview,
} from '@/routes/orders';

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
    subtotal: number;
    delivery_fee: number;
    total: number;
    delivery_address: string | null;
    contact_number: string;
    notes: string | null;
    cancellation_reason: string | null;
    can_cancel: boolean;
    can_review: boolean;
    review: { rating: number; comment: string | null } | null;
    gcash: {
        number: string | null;
        qr_url: string | null;
        reference: string | null;
        awaiting_payment: boolean;
    } | null;
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
    items: OrderItem[];
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

function timelineSteps(order: Order): { label: string; at: string | null }[] {
    const readyStep =
        order.fulfillment_type === 'delivery'
            ? { label: 'Out for delivery', at: null }
            : { label: 'Ready for pickup', at: null };

    return [
        { label: 'Order placed', at: order.created_at },
        { label: 'Confirmed', at: order.confirmed_at },
        { label: 'Preparing', at: null },
        readyStep,
        { label: 'Completed', at: order.completed_at },
    ];
}

const STATUS_RANK: Record<string, number> = {
    pending_payment: 0,
    pending: 0,
    confirmed: 1,
    preparing: 2,
    ready_for_pickup: 3,
    out_for_delivery: 3,
    completed: 4,
};

function GcashCard({ order }: { order: Order }) {
    const gcash = order.gcash!;
    const { data, setData, post, processing, errors } = useForm<{
        reference: string;
    }>({ reference: gcash.reference ?? '' });

    function submit() {
        post(orderGcashReference(order.id).url, { preserveScroll: true });
    }

    return (
        <div className="mb-6 rounded-xl border border-attention/40 bg-attention-wash p-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">
                Pay with GCash
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
                Send your payment to the store's GCash, then enter your
                reference number below. The seller confirms once received.
            </p>

            {gcash.number && (
                <div className="mb-3 rounded-lg border border-border bg-card p-3 text-sm">
                    <span className="text-muted-foreground">
                        GCash number:{' '}
                    </span>
                    <span className="font-semibold text-foreground">
                        {gcash.number}
                    </span>
                </div>
            )}

            {gcash.qr_url && (
                <img
                    src={gcash.qr_url}
                    alt="GCash QR"
                    className="mb-3 h-44 w-44 rounded-lg border border-border object-cover"
                />
            )}

            <Label htmlFor="gcash-ref">GCash reference number</Label>
            <Input
                id="gcash-ref"
                value={data.reference}
                onChange={(e) => setData('reference', e.target.value)}
                placeholder="e.g. 1234567890123"
                className="mt-1"
            />
            <InputError className="mt-1" message={errors.reference} />

            <div className="mt-3 flex items-center gap-3">
                <Button
                    disabled={processing || data.reference.trim() === ''}
                    onClick={submit}
                >
                    {gcash.reference ? 'Update reference' : 'Submit reference'}
                </Button>
                {gcash.reference && (
                    <span className="text-xs text-muted-foreground">
                        Submitted — awaiting seller confirmation.
                    </span>
                )}
            </div>
        </div>
    );
}

function ReviewCard({ order }: { order: Order }) {
    const [editing, setEditing] = useState(order.review === null);
    const { data, setData, post, processing, errors } = useForm<{
        rating: number;
        comment: string;
    }>({
        rating: order.review?.rating ?? 0,
        comment: order.review?.comment ?? '',
    });

    function submit() {
        post(orderReview(order.id).url, {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    }

    if (order.review && !editing) {
        return (
            <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">
                        Your review
                    </h2>
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Edit
                    </button>
                </div>
                <StarRating value={order.review.rating} />
                {order.review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">
                        {order.review.comment}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">
                Rate your experience
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
                How was your order from this supplier?
            </p>

            <StarRating
                value={data.rating}
                onChange={(rating) => setData('rating', rating)}
                size={28}
            />
            <InputError className="mt-1" message={errors.rating} />

            <Textarea
                value={data.comment}
                onChange={(e) => setData('comment', e.target.value)}
                placeholder="Share a few words (optional)…"
                className="mt-3 min-h-20"
            />
            <InputError message={errors.comment} />

            <div className="mt-3 flex items-center gap-3">
                <Button
                    disabled={processing || data.rating < 1}
                    onClick={submit}
                >
                    {order.review ? 'Update review' : 'Submit review'}
                </Button>
                {order.review && (
                    <Button variant="ghost" onClick={() => setEditing(false)}>
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function OrderShow({ order }: { order: Order }) {
    const [cancelOpen, setCancelOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<{
        reason: string;
    }>({ reason: '' });

    const isTerminated =
        order.status === 'cancelled' || order.status === 'rejected';
    const currentRank = STATUS_RANK[order.status] ?? -1;

    function confirmCancel() {
        post(orderCancel(order.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setCancelOpen(false);
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
                            {order.store.name}
                        </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                        {order.status_label}
                    </span>
                </div>

                {isTerminated ? (
                    <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
                        <p className="text-sm font-medium text-foreground">
                            {order.status === 'rejected'
                                ? 'Order rejected'
                                : 'Order cancelled'}
                            {order.cancelled_at
                                ? ` · ${formatDateTime(order.cancelled_at)}`
                                : ''}
                        </p>
                        {order.cancellation_reason && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {order.cancellation_reason}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
                        <ol className="space-y-4">
                            {timelineSteps(order).map((step, i) => {
                                const done = i <= currentRank;
                                const active = i === currentRank;

                                return (
                                    <li
                                        key={step.label}
                                        className="flex items-start gap-3"
                                    >
                                        <span
                                            className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                                done
                                                    ? 'border-primary bg-primary'
                                                    : 'border-border bg-background'
                                            }`}
                                        />
                                        <div className="flex-1">
                                            <p
                                                className={`text-sm ${
                                                    active
                                                        ? 'font-semibold text-foreground'
                                                        : done
                                                          ? 'text-foreground'
                                                          : 'text-muted-foreground'
                                                }`}
                                            >
                                                {step.label}
                                            </p>
                                            {step.at && (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(step.at)}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                )}

                {order.gcash?.awaiting_payment && <GcashCard order={order} />}

                {order.can_review && <ReviewCard order={order} />}

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

                {order.can_cancel && (
                    <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => setCancelOpen(true)}
                    >
                        Cancel order
                    </Button>
                )}
            </div>

            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel this order?</DialogTitle>
                        <DialogDescription>
                            Let the seller know why (optional). This can't be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Textarea
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="Reason (optional)"
                            className="min-h-20"
                        />
                        <InputError message={errors.reason} />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setCancelOpen(false)}
                        >
                            Keep order
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={processing}
                            onClick={confirmCancel}
                        >
                            Cancel order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
