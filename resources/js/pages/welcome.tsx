import { Head, Link } from '@inertiajs/react';
import { MapPin, Truck } from 'lucide-react';
import StockLevel from '@/components/stock-level';
import type { StockState } from '@/components/stock-level';
import { register as sellerRegister } from '@/routes/seller';
import { index as storesIndex, show as storesShow } from '@/routes/stores';

type RecentStore = {
    id: number;
    name: string;
    address: string;
    type: string | null;
    store_availability: StockState;
    price_min: number | null;
    price_max: number | null;
    last_updated_at: string | null;
};

type Props = {
    recentlyUpdated: RecentStore[];
    supplierCount: number;
};

const TYPE_LABELS: Record<string, string> = {
    pickup: 'Pickup',
    delivery: 'Delivery',
    both: 'Pickup & delivery',
};

const DESCRIPTION =
    'Check which water refilling stations near you have stock before you go. Compare prices, see who delivers, and order from local suppliers across the Philippines.';

function formatPrice(price: number): string {
    return '₱' + price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function priceRange(min: number | null, max: number | null): string | null {
    if (min === null) {
        return null;
    }

    return min === max
        ? formatPrice(min)
        : `${formatPrice(min)}–${formatPrice(max!)}`;
}

function updatedAgo(iso: string | null): string {
    if (!iso) {
        return 'Not updated yet';
    }

    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

    if (minutes < 1) {
        return 'Updated just now';
    }

    if (minutes < 60) {
        return `Updated ${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `Updated ${hours}h ago`;
    }

    return `Updated ${Math.floor(hours / 24)}d ago`;
}

function StoreRow({ store }: { store: RecentStore }) {
    const range = priceRange(store.price_min, store.price_max);

    return (
        <Link
            href={storesShow(store.id)}
            className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40"
        >
            <StockLevel
                state={store.store_availability}
                size="md"
                showLabel={false}
                className="shrink-0"
            />

            <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-bold text-foreground group-hover:text-primary">
                    {store.name}
                </span>
                <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{store.address}</span>
                    </span>
                    {store.type && (
                        <span className="inline-flex items-center gap-1">
                            <Truck className="size-3 shrink-0" />
                            {TYPE_LABELS[store.type] ?? store.type}
                        </span>
                    )}
                </span>
            </span>

            <span className="shrink-0 text-right">
                {range && (
                    <span className="block font-display text-lg font-bold text-foreground tabular-nums">
                        {range}
                    </span>
                )}
                <span className="block text-xs text-muted-foreground tabular-nums">
                    {updatedAgo(store.last_updated_at)}
                </span>
            </span>
        </Link>
    );
}

export default function Welcome({ recentlyUpdated, supplierCount }: Props) {
    const hasStores = recentlyUpdated.length > 0;

    return (
        <>
            {/* The app name is appended by createInertiaApp, so it is left out here. */}
            <Head title="See who has water before you go">
                <meta name="description" content={DESCRIPTION} />
                <meta
                    property="og:title"
                    content="Sakada PH — See who has water before you go"
                />
                <meta property="og:description" content={DESCRIPTION} />
                <meta property="og:type" content="website" />
            </Head>

            <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-6 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center lg:gap-16">
                <div>
                    <h1 className="text-4xl leading-[0.95] font-bold tracking-tight text-foreground uppercase sm:text-6xl">
                        See who has water
                        <br />
                        before you go.
                    </h1>

                    <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Water stations run out without warning. Sakada shows you
                        what each supplier near you has in stock right now, what
                        they charge, and whether they deliver — so you stop
                        making the trip to find out.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href={storesIndex()}
                            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                        >
                            Find suppliers near me
                        </Link>
                        <Link
                            href={sellerRegister()}
                            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                            List your station
                        </Link>
                    </div>
                </div>

                {hasStores && (
                    <section className="min-w-0">
                        <div className="mb-3 flex items-baseline justify-between gap-4">
                            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                Latest stock updates
                            </h2>
                            <Link
                                href={storesIndex()}
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                {supplierCount === 1
                                    ? 'See 1 supplier'
                                    : `See all ${supplierCount} suppliers`}
                            </Link>
                        </div>

                        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
                            {recentlyUpdated.map((store) => (
                                <StoreRow key={store.id} store={store} />
                            ))}
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                            Suppliers update their own stock. The water level
                            shows what each one last reported.
                        </p>
                    </section>
                )}
            </div>
        </>
    );
}
