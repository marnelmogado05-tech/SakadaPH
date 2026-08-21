import { Form, Head, Link, useForm } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import OrderStatus from '@/components/order-status';
import type { OrderState } from '@/components/order-status';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    advance as advanceOrder,
    confirm as confirmOrder,
    index as ordersIndex,
    reject as rejectOrder,
    show as orderShow,
} from '@/routes/seller/orders';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type OrderRow = {
    id: number;
    reference: string;
    customer_name: string;
    status: OrderState;
    status_label: string;
    fulfillment_type: string;
    payment_status: string;
    total: number;
    items_count: number;
    created_at: string | null;
    can_confirm: boolean;
    can_reject: boolean;
    next_status_label: string | null;
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
            href={status ? ordersIndex({ query: { status } }) : ordersIndex()}
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

/**
 * Confirm and advance post straight from the queue so a seller can clear a
 * morning's orders without opening each one. Rejection is deliberately not a
 * one-click action — it needs a reason and cannot be undone.
 */
function OrderActions({
    order,
    onReject,
}: {
    order: OrderRow;
    onReject: () => void;
}) {
    if (order.can_confirm) {
        return (
            <div className="flex items-center gap-2">
                <Form
                    action={confirmOrder.url(order.id)}
                    method="post"
                    options={{ preserveScroll: true }}
                >
                    {({ processing }) => (
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="min-h-11"
                        >
                            {processing ? 'Confirming…' : 'Confirm'}
                        </Button>
                    )}
                </Form>
                {order.can_reject && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onReject}
                        className="min-h-11"
                    >
                        Reject
                    </Button>
                )}
            </div>
        );
    }

    if (order.next_status_label) {
        return (
            <Form
                action={advanceOrder.url(order.id)}
                method="post"
                options={{ preserveScroll: true }}
            >
                {({ processing }) => (
                    <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={processing}
                        className="min-h-11"
                    >
                        {processing
                            ? 'Saving…'
                            : `Mark ${order.next_status_label!.toLowerCase()}`}
                    </Button>
                )}
            </Form>
        );
    }

    return null;
}

/**
 * Rejection needs a reason and is terminal, so it confirms rather than firing
 * from the row. Posting with preserveScroll keeps the queue where the seller
 * left it.
 */
function RejectDialog({
    order,
    onClose,
}: {
    order: OrderRow | null;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<{ reason: string }>({ reason: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (!order) {
            return;
        }

        post(rejectOrder.url(order.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                onClose();
            },
        });
    }

    return (
        <Dialog
            open={order !== null}
            onOpenChange={(open) => {
                if (!open) {
                    reset();
                    clearErrors();
                    onClose();
                }
            }}
        >
            <DialogContent>
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>
                            Reject order {order?.reference}?
                        </DialogTitle>
                        <DialogDescription>
                            {order?.customer_name} will be told why. This cannot
                            be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label htmlFor="reject-reason">Reason</Label>
                        <Textarea
                            id="reject-reason"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="Out of stock until Thursday"
                            className="mt-1.5"
                            autoFocus
                        />
                        <InputError message={errors.reason} className="mt-1" />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Keep order
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={processing}
                        >
                            {processing ? 'Rejecting…' : 'Reject order'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function SellerOrdersIndex({
    orders,
    filters,
    statusCounts,
}: Props) {
    const [rejecting, setRejecting] = useState<OrderRow | null>(null);

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
                            <div
                                key={order.id}
                                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 transition-colors hover:bg-secondary/40"
                            >
                                <Link
                                    href={orderShow(order.id)}
                                    className="min-w-0 flex-1"
                                >
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            {order.reference}
                                        </p>
                                        {order.payment_status === 'paid' && (
                                            <span className="rounded-full bg-stock-full-wash px-1.5 py-0.5 text-[10px] font-medium text-stock-full">
                                                Paid
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {order.customer_name} ·{' '}
                                        {order.items_count} item
                                        {order.items_count === 1
                                            ? ''
                                            : 's'} · {order.fulfillment_type} ·{' '}
                                        {formatDate(order.created_at)}
                                    </p>
                                </Link>

                                <div className="flex shrink-0 items-center gap-3">
                                    <div className="flex flex-col items-end gap-1">
                                        <OrderStatus
                                            state={order.status}
                                            label={order.status_label}
                                        />
                                        <span className="font-display text-base font-bold text-foreground tabular-nums">
                                            {formatPrice(order.total)}
                                        </span>
                                    </div>
                                    <OrderActions
                                        order={order}
                                        onReject={() => setRejecting(order)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <RejectDialog
                    order={rejecting}
                    onClose={() => setRejecting(null)}
                />

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
