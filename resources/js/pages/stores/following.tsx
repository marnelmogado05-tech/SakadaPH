import { Head, Link } from '@inertiajs/react';
import { Bell, MapPin, Truck } from 'lucide-react';
import { index as storesIndex, show as storesShow } from '@/routes/stores';

type FollowedStore = {
    id: number;
    name: string;
    address: string;
    type: string | null;
    store_availability: string;
    last_updated_at: string | null;
};

type Props = {
    stores: FollowedStore[];
};

const AVAILABILITY_LABELS: Record<string, { label: string; className: string }> = {
    in_stock: { label: 'In stock', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    low_stock: { label: 'Low stock', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    out_of_stock: { label: 'Out of stock', className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' },
    no_products: { label: 'No products', className: 'bg-secondary text-muted-foreground' },
};

function storeTypeLabel(type: string | null): string | null {
    if (type === 'pickup') {
        return 'Pickup only';
    }

    if (type === 'delivery') {
        return 'Delivery only';
    }

    if (type === 'both') {
        return 'Pickup & Delivery';
    }

    return null;
}

export default function StoresFollowing({ stores }: Props) {
    return (
        <>
            <Head title="Following" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Following</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Stores you follow — get alerts when they restock.
                    </p>
                </div>

                {stores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 py-20 text-center">
                        <Bell className="mb-3 size-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-foreground">No stores followed yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Follow a store from its page to get stock alerts.
                        </p>
                        <Link
                            href={storesIndex()}
                            className="mt-4 text-sm font-medium text-primary hover:underline"
                        >
                            Browse stores
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {stores.map((store) => {
                            const avail = AVAILABILITY_LABELS[store.store_availability] ?? AVAILABILITY_LABELS.no_products;
                            const typeLabel = storeTypeLabel(store.type);

                            return (
                                <Link
                                    key={store.id}
                                    href={storesShow(store.id)}
                                    className="group block rounded-xl border border-border/60 bg-card p-5 transition-shadow hover:shadow-md"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <h2 className="text-sm font-semibold text-foreground group-hover:text-primary">
                                            {store.name}
                                        </h2>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${avail.className}`}>
                                            {avail.label}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                            <span className="line-clamp-1">{store.address}</span>
                                        </div>

                                        {typeLabel && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Truck className="size-3.5 shrink-0" />
                                                <span>{typeLabel}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
