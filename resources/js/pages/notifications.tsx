import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CheckCheck,
    Receipt,
    Store,
    Truck,
    UserPlus,
    XCircle,
} from 'lucide-react';
import { notifications as notificationsRoute } from '@/routes';
import { readAll } from '@/routes/notifications';
import { show as storesShow } from '@/routes/stores';

type Notification = {
    id: string;
    type: string;
    message: string;
    store_id: number | null;
    store_name: string | null;
    url: string | null;
    url_label: string | null;
    read_at: string | null;
    created_at: string;
};

type PaginatedNotifications = {
    data: Notification[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = {
    notifications: PaginatedNotifications;
};

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);

    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function NotificationIcon({ type }: { type: string }) {
    if (type === 'stock_restored') {
        return <Store className="size-4 text-stock-full" />;
    }

    if (type === 'seller_approved') {
        return <CheckCheck className="size-4 text-status-active" />;
    }

    if (type === 'order_completed') {
        return <CheckCheck className="size-4 text-order-done" />;
    }

    if (type === 'seller_registered') {
        return <UserPlus className="size-4 text-primary" />;
    }

    if (type === 'order_rejected' || type === 'order_cancelled') {
        return <XCircle className="size-4 text-destructive" />;
    }

    if (type === 'seller_rejected') {
        return <Bell className="size-4 text-destructive" />;
    }

    if (type === 'order_ready' || type === 'order_out_for_delivery') {
        return <Truck className="size-4 text-order-move" />;
    }

    if (type === 'order_placed' || type === 'order_confirmed') {
        return <Receipt className="size-4 text-primary" />;
    }

    return <Bell className="size-4 text-muted-foreground" />;
}

export default function Notifications({ notifications }: Props) {
    const { auth } = usePage().props;
    const role = auth.user?.role;
    const isSidebar = role === 'admin' || role === 'seller';

    const emptyHint =
        role === 'admin'
            ? 'Seller registrations and platform activity will appear here.'
            : role === 'seller'
              ? 'New orders and customer activity will appear here.'
              : 'Follow stores to receive stock alerts.';

    return (
        <>
            <Head title="Notifications" />

            <div
                className={
                    isSidebar
                        ? 'space-y-6 p-6'
                        : 'mx-auto max-w-2xl space-y-6 px-4 py-8'
                }
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1
                            className={
                                isSidebar
                                    ? 'text-lg font-semibold text-foreground'
                                    : 'text-2xl font-semibold tracking-tight text-foreground'
                            }
                        >
                            Notifications
                        </h1>
                        {isSidebar && (
                            <p className="text-sm text-muted-foreground">
                                {role === 'admin'
                                    ? 'Seller registrations and platform activity.'
                                    : 'Order and customer activity for your store.'}
                            </p>
                        )}
                    </div>

                    {notifications.data.some((n) => n.read_at === null) && (
                        <Link
                            href={readAll()}
                            method="post"
                            as="button"
                            className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <CheckCheck className="size-4" />
                            Mark all read
                        </Link>
                    )}
                </div>

                {notifications.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 py-20 text-center">
                        <Bell className="mb-3 size-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-foreground">
                            No notifications yet
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {emptyHint}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
                        {notifications.data.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-4 px-5 py-4 ${notification.read_at === null ? 'bg-primary/5' : ''}`}
                            >
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                                    <NotificationIcon
                                        type={notification.type}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-foreground">
                                        {notification.message}
                                    </p>

                                    {notification.url ? (
                                        <Link
                                            href={notification.url}
                                            className="mt-0.5 inline-block text-xs font-medium text-primary hover:underline"
                                        >
                                            {notification.url_label ??
                                                'View order'}
                                        </Link>
                                    ) : (
                                        notification.store_id &&
                                        notification.store_name && (
                                            <Link
                                                href={storesShow(
                                                    notification.store_id,
                                                )}
                                                className="mt-0.5 inline-block text-xs font-medium text-primary hover:underline"
                                            >
                                                View {notification.store_name}
                                            </Link>
                                        )
                                    )}

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formatDate(notification.created_at)}
                                    </p>
                                </div>

                                {notification.read_at === null && (
                                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {notifications.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-3">
                        {notifications.prev_page_url && (
                            <Link
                                href={notifications.prev_page_url}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Previous
                            </Link>
                        )}
                        {notifications.next_page_url && (
                            <Link
                                href={notifications.next_page_url}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

Notifications.layout = {
    breadcrumbs: [{ title: 'Notifications', href: notificationsRoute() }],
};
