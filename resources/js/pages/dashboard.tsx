import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, MapPin, Store } from 'lucide-react';
import { following, notifications as notificationsRoute } from '@/routes';
import { index as storesIndex } from '@/routes/stores';

export default function Dashboard() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Welcome, {auth.user.first_name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Find water suppliers near you and stay updated on stock.
                    </p>
                </div>

                <div className="grid gap-3">
                    <Link
                        href={storesIndex()}
                        className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <MapPin className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                                Browse suppliers
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Find nearby water suppliers on the map
                            </p>
                        </div>
                    </Link>

                    <Link
                        href={following()}
                        className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Store className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                                Following
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Stores you follow for restock alerts
                            </p>
                        </div>
                    </Link>

                    <Link
                        href={notificationsRoute()}
                        className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Bell className="size-5 text-primary" />
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                                    Notifications
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Stock alerts and updates
                                </p>
                            </div>
                            {auth.notifications_count > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                                    {auth.notifications_count > 99
                                        ? '99+'
                                        : auth.notifications_count}
                                </span>
                            )}
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
}
