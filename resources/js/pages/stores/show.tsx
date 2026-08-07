import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Bell, BellOff, MapPin, Phone, Truck } from 'lucide-react';
import { follow as storesFollow, index as storesIndex, unfollow as storesUnfollow } from '@/routes/stores';

type Product = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    unit: string;
    quantity: number;
    availability: string;
    image_url: string | null;
};

type StoreDetail = {
    id: number;
    name: string;
    description: string | null;
    address: string;
    contact_number: string | null;
    type: string | null;
    is_followed: boolean;
    can_follow: boolean;
};

type Props = {
    store: StoreDetail;
    products: Product[];
};

function formatPrice(price: string): string {
    return '₱' + parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

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

function availabilityBadge(availability: string) {
    if (availability === 'low_stock') {
        return (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                Low stock
            </span>
        );
    }

    return null;
}

function FollowButton({ store }: { store: StoreDetail }) {
    const { post, processing } = useForm({});

    function toggle() {
        const route = store.is_followed ? storesUnfollow(store.id) : storesFollow(store.id);
        post(route.url, { preserveScroll: true });
    }

    return (
        <button
            onClick={toggle}
            disabled={processing}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                store.is_followed
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
        >
            {store.is_followed ? (
                <>
                    <BellOff className="size-3.5" />
                    Unfollow
                </>
            ) : (
                <>
                    <Bell className="size-3.5" />
                    Follow for alerts
                </>
            )}
        </button>
    );
}

export default function StoresShow({ store, products }: Props) {
    const typeLabel = storeTypeLabel(store.type);

    return (
        <>
            <Head title={store.name}>
                <meta
                    name="description"
                    content={
                        store.description
                            ? `${store.description.slice(0, 140)} — ${store.address}`
                            : `Buy water from ${store.name} in ${store.address}. Check live stock and availability on Sakada PH.`
                    }
                />
                <meta property="og:title" content={`${store.name} — Sakada PH`} />
                <meta
                    property="og:description"
                    content={
                        store.description
                            ? `${store.description.slice(0, 140)} — ${store.address}`
                            : `Buy water from ${store.name} in ${store.address}. Check live stock and availability on Sakada PH.`
                    }
                />
                <meta property="og:type" content="business.business" />
            </Head>

            <div className="mx-auto max-w-5xl px-6 py-10">
                <Link
                    href={storesIndex()}
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    All suppliers
                </Link>

                <div className="mb-8 rounded-xl border border-border/60 bg-card p-6">
                    <div className="mb-3 flex items-start justify-between gap-4">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            {store.name}
                        </h1>

                        {store.can_follow && <FollowButton store={store} />}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 size-4 shrink-0" />
                            <span>{store.address}</span>
                        </div>

                        {store.contact_number && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="size-4 shrink-0" />
                                <span>{store.contact_number}</span>
                            </div>
                        )}

                        {typeLabel && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Truck className="size-4 shrink-0" />
                                <span>{typeLabel}</span>
                            </div>
                        )}
                    </div>

                    {store.description && (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            {store.description}
                        </p>
                    )}
                </div>

                <div>
                    <h2 className="mb-4 text-base font-semibold text-foreground">
                        Available products
                    </h2>

                    {products.length === 0 ? (
                        <p className="rounded-xl border border-border/60 py-12 text-center text-sm text-muted-foreground">
                            No products listed yet.
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="overflow-hidden rounded-xl border border-border/60 bg-card"
                                >
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="h-40 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-40 w-full bg-secondary/40" />
                                    )}

                                    <div className="p-5">
                                        <div className="mb-1 flex items-start justify-between gap-2">
                                            <h3 className="text-sm font-medium text-foreground">
                                                {product.name}
                                            </h3>
                                            <span className="shrink-0 text-sm font-semibold text-primary">
                                                {formatPrice(product.price)}
                                            </span>
                                        </div>

                                        <p className="mb-3 text-xs text-muted-foreground">
                                            per {product.unit}
                                        </p>

                                        {product.description && (
                                            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">
                                                {product.quantity} in stock
                                            </p>
                                            {availabilityBadge(product.availability)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
