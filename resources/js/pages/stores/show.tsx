import {
    Deferred,
    Head,
    Link,
    router,
    useForm,
    usePage,
} from '@inertiajs/react';
import {
    ArrowLeft,
    Bell,
    BellOff,
    MapPin,
    Phone,
    Plus,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import { StarRating } from '@/components/star-rating';
import StockLevel from '@/components/stock-level';
import type { StockState } from '@/components/stock-level';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { store as cartStore } from '@/routes/cart';
import {
    follow as storesFollow,
    index as storesIndex,
    unfollow as storesUnfollow,
} from '@/routes/stores';

type Product = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    unit: string;
    quantity: number;
    availability: StockState;
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
    rating_avg: number | null;
    rating_count: number;
};

type Review = {
    id: number;
    rating: number;
    comment: string | null;
    reviewer: string;
    created_at: string | null;
};

type Props = {
    store: StoreDetail;
    products: Product[];
    reviews?: Review[];
};

function formatReviewDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatPrice(price: string): string {
    return (
        '₱' +
        parseFloat(price)
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    );
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

function FollowButton({ store }: { store: StoreDetail }) {
    const { post, processing } = useForm({});

    function toggle() {
        const route = store.is_followed
            ? storesUnfollow(store.id)
            : storesFollow(store.id);
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

function ReviewsSkeleton() {
    return (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading reviews</span>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="rounded-xl border border-border/60 bg-card p-4"
                >
                    <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="mt-2 h-3.5 w-24" />
                    <Skeleton className="mt-3 h-3.5 w-full" />
                    <Skeleton className="mt-1.5 h-3.5 w-2/3" />
                </div>
            ))}
        </div>
    );
}

export default function StoresShow({ store, products, reviews }: Props) {
    const typeLabel = storeTypeLabel(store.type);
    const { auth } = usePage().props;
    const isConsumer = auth.user?.role === 'user';

    const [pendingProductId, setPendingProductId] = useState<number | null>(
        null,
    );
    const [addingId, setAddingId] = useState<number | null>(null);

    function addToCart(productId: number, force = false) {
        setAddingId(productId);
        router.post(
            cartStore().url,
            { product_id: productId, quantity: 1, force },
            {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.store_conflict) {
                        setPendingProductId(productId);
                    }
                },
                onSuccess: () => setPendingProductId(null),
                onFinish: () => setAddingId(null),
            },
        );
    }

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
                <meta
                    property="og:title"
                    content={`${store.name} — Sakada PH`}
                />
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

                    {store.rating_count > 0 && store.rating_avg !== null && (
                        <div className="mb-3 flex items-center gap-2">
                            <StarRating
                                value={Math.round(store.rating_avg)}
                                size={16}
                            />
                            <span className="text-sm font-medium text-foreground">
                                {store.rating_avg.toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                ({store.rating_count} review
                                {store.rating_count === 1 ? '' : 's'})
                            </span>
                        </div>
                    )}

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
                                            loading="lazy"
                                            decoding="async"
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
                                            <span className="shrink-0 font-display text-base font-bold text-primary tabular-nums">
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
                                                <span className="tabular-nums">
                                                    {product.quantity}
                                                </span>{' '}
                                                in stock
                                            </p>
                                            <StockLevel
                                                state={product.availability}
                                                size="sm"
                                                className="shrink-0"
                                            />
                                        </div>

                                        {isConsumer && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="mt-4 w-full"
                                                disabled={
                                                    addingId === product.id
                                                }
                                                onClick={() =>
                                                    addToCart(product.id)
                                                }
                                            >
                                                <Plus className="size-4" />
                                                Add to cart
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {store.rating_count > 0 && (
                    <div className="mt-10">
                        <h2 className="mb-4 text-base font-semibold text-foreground">
                            Customer reviews
                        </h2>
                        <Deferred data="reviews" fallback={<ReviewsSkeleton />}>
                            <div className="space-y-3">
                                {(reviews ?? []).map((review) => (
                                    <div
                                        key={review.id}
                                        className="rounded-xl border border-border/60 bg-card p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-foreground">
                                                {review.reviewer}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatReviewDate(
                                                    review.created_at,
                                                )}
                                            </span>
                                        </div>
                                        <StarRating
                                            value={review.rating}
                                            size={14}
                                            className="mt-1"
                                        />
                                        {review.comment && (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {review.comment}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Deferred>
                    </div>
                )}
            </div>

            <Dialog
                open={pendingProductId !== null}
                onOpenChange={(open) => !open && setPendingProductId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start a new cart?</DialogTitle>
                        <DialogDescription>
                            Your cart has items from another store. Adding this
                            product will clear your current cart.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setPendingProductId(null)}
                        >
                            Keep current cart
                        </Button>
                        <Button
                            onClick={() =>
                                pendingProductId !== null &&
                                addToCart(pendingProductId, true)
                            }
                        >
                            Clear &amp; add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
