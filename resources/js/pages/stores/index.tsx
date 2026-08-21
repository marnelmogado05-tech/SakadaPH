import { Head, Link, router } from '@inertiajs/react';
import {
    LayoutList,
    Loader2,
    Map,
    MapPin,
    Navigation,
    Package,
    Search,
    Truck,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import StockLevel from '@/components/stock-level';
import type { StockState } from '@/components/stock-level';
import StoresMap from '@/components/stores-map';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { index as storesIndex, show as storesShow } from '@/routes/stores';

type Store = {
    id: number;
    name: string;
    description: string | null;
    address: string;
    type: string | null;
    latitude: number | null;
    longitude: number | null;
    products_count: number;
    distance_km: number | null;
    store_availability: StockState;
    price_min: number | null;
    price_max: number | null;
    last_updated_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedStores = {
    data: Store[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
};

type Filters = {
    search: string;
    type: string;
    in_stock_only: boolean;
    max_distance: number | null;
    lat: number | null;
    lng: number | null;
};

type Props = {
    stores: PaginatedStores;
    filters: Filters;
};

const TYPE_LABELS: Record<string, string> = {
    pickup: 'Pickup',
    delivery: 'Delivery',
    both: 'Pickup & Delivery',
};

const DISTANCE_PRESETS = [5, 10, 20] as const;

function formatPrice(price: number): string {
    return '₱' + price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function priceRange(min: number | null, max: number | null): string | null {
    if (min === null) {
        return null;
    }

    if (min === max) {
        return formatPrice(min);
    }

    return `${formatPrice(min)} – ${formatPrice(max!)}`;
}

function relativeTime(iso: string | null): string | null {
    if (!iso) {
        return null;
    }

    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 60) {
        return `Updated ${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `Updated ${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `Updated ${days}d ago`;
}

function StoreCardsSkeleton({ count }: { count: number }) {
    return (
        <div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"
            aria-busy="true"
            aria-live="polite"
        >
            <span className="sr-only">Updating results</span>
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    className="flex flex-col rounded-xl border border-border/60 bg-card p-4"
                >
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="mb-1.5 h-3 w-3/4" />
                    <Skeleton className="mb-2 h-3 w-24" />
                    <div className="mt-auto flex items-center justify-between pt-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function StoresIndex({ stores, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [locationStatus, setLocationStatus] = useState<
        'idle' | 'requesting' | 'granted' | 'denied'
    >(filters.lat && filters.lng ? 'granted' : 'idle');
    const [loading, setLoading] = useState(false);
    const latLng = useRef<{ lat: number; lng: number } | null>(
        filters.lat && filters.lng
            ? { lat: filters.lat, lng: filters.lng }
            : null,
    );
    const [hoveredStoreId, setHoveredStoreId] = useState<number | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

    const applyFilters = useCallback(
        (overrides: Partial<Filters & { lat?: number; lng?: number }> = {}) => {
            const ll = latLng.current;
            router.get(
                storesIndex(),
                {
                    search: (overrides.search ?? search) || undefined,
                    type:
                        (overrides.type !== undefined
                            ? overrides.type
                            : filters.type) || undefined,
                    in_stock_only:
                        (overrides.in_stock_only !== undefined
                            ? overrides.in_stock_only
                            : filters.in_stock_only) || undefined,
                    max_distance:
                        (overrides.max_distance !== undefined
                            ? overrides.max_distance
                            : filters.max_distance) || undefined,
                    lat: overrides.lat ?? ll?.lat ?? undefined,
                    lng: overrides.lng ?? ll?.lng ?? undefined,
                },
                {
                    preserveScroll: true,
                    replace: true,
                    only: ['stores', 'filters'],
                    onStart: () => setLoading(true),
                    onFinish: () => setLoading(false),
                },
            );
        },
        [filters, search],
    );

    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    function handleSearch(value: string) {
        setSearch(value);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(
            () => applyFilters({ search: value }),
            350,
        );
    }

    function requestLocation() {
        if (!navigator.geolocation) {
            setLocationStatus('denied');

            return;
        }

        setLocationStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                latLng.current = { lat: latitude, lng: longitude };
                setLocationStatus('granted');
                applyFilters({ lat: latitude, lng: longitude });
            },
            () => setLocationStatus('denied'),
            { timeout: 8000 },
        );
    }

    const hasLocation = locationStatus === 'granted';
    const hasActiveFilters = Boolean(
        filters.search ||
        filters.type ||
        filters.in_stock_only ||
        filters.max_distance,
    );

    function clearFilters() {
        setSearch('');
        applyFilters({
            search: '',
            type: '',
            in_stock_only: false,
            max_distance: null,
        });
    }

    const mapPanel = (
        <div className="h-[450px] overflow-hidden rounded-xl border border-border/60 lg:h-[calc(100vh-200px)]">
            <StoresMap
                stores={stores.data}
                userLat={filters.lat}
                userLng={filters.lng}
                maxDistanceKm={filters.max_distance}
                hoveredStoreId={hoveredStoreId}
            />
        </div>
    );

    return (
        <>
            <Head title="Find Water Suppliers">
                <meta
                    name="description"
                    content="Browse water suppliers near you in the Philippines. Filter by location, check real-time stock availability, and find pickup or delivery options."
                />
                <meta
                    property="og:title"
                    content="Find Water Suppliers — Sakada PH"
                />
                <meta
                    property="og:description"
                    content="Browse water suppliers near you in the Philippines. Filter by location, check real-time stock availability, and find pickup or delivery options."
                />
                <meta property="og:type" content="website" />
            </Head>

            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
                        Water suppliers
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {hasLocation
                            ? 'Sorted by distance from your location.'
                            : 'Browse approved water suppliers near you.'}
                    </p>
                </div>

                {/* Location prompt — asked for only once the user can see
                    what it buys them, never on mount. */}
                {locationStatus !== 'granted' && (
                    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-accent/40 px-4 py-3 text-sm">
                        <Navigation className="size-4 shrink-0 text-accent-foreground" />
                        <p className="text-foreground">
                            {locationStatus === 'denied'
                                ? 'Location is blocked, so stores are listed alphabetically. Allow it in your browser to sort by distance.'
                                : 'Sort these stores by how close they are to you.'}
                        </p>
                        {locationStatus !== 'denied' && (
                            <button
                                type="button"
                                onClick={requestLocation}
                                disabled={locationStatus === 'requesting'}
                                className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                                {locationStatus === 'requesting' && (
                                    <Loader2 className="size-4 animate-spin" />
                                )}
                                {locationStatus === 'requesting'
                                    ? 'Finding you…'
                                    : 'Sort by distance'}
                            </button>
                        )}
                    </div>
                )}

                {/* Search + Filters */}
                <div className="mb-4 space-y-3">
                    <div className="relative max-w-sm">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by name or area…"
                            className="pl-9"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {(['', 'pickup', 'delivery', 'both'] as const).map(
                            (t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => applyFilters({ type: t })}
                                    className={[
                                        'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors',
                                        filters.type === t
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                                    ].join(' ')}
                                >
                                    {t === '' ? 'All types' : TYPE_LABELS[t]}
                                </button>
                            ),
                        )}

                        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                            <input
                                type="checkbox"
                                className="size-4 accent-primary"
                                checked={filters.in_stock_only}
                                onChange={(e) =>
                                    applyFilters({
                                        in_stock_only: e.target.checked,
                                    })
                                }
                            />
                            In Stock only
                        </label>

                        {hasLocation && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm text-muted-foreground">
                                    Within:
                                </span>
                                {DISTANCE_PRESETS.map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() =>
                                            applyFilters({
                                                max_distance:
                                                    filters.max_distance === d
                                                        ? null
                                                        : d,
                                            })
                                        }
                                        className={[
                                            'inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-medium transition-colors',
                                            filters.max_distance === d
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                                        ].join(' ')}
                                    >
                                        {d} km
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile view tabs */}
                <div className="mb-4 flex overflow-hidden rounded-lg border border-border lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileView('list')}
                        className={[
                            'flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-colors',
                            mobileView === 'list'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                    >
                        <LayoutList className="size-4" />
                        List
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileView('map')}
                        className={[
                            'flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-colors',
                            mobileView === 'map'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                    >
                        <Map className="size-4" />
                        Map
                    </button>
                </div>

                {/* Mobile map view */}
                {mobileView === 'map' && (
                    <div className="lg:hidden">{mapPanel}</div>
                )}

                {/* Main content: list + map side by side on desktop */}
                <div
                    className={`flex items-start gap-6 ${mobileView === 'map' ? 'hidden lg:flex' : ''}`}
                >
                    {/* List column */}
                    <div className="min-w-0 flex-1">
                        {loading ? (
                            <StoreCardsSkeleton
                                count={Math.max(stores.data.length, 3)}
                            />
                        ) : stores.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 py-20 text-center">
                                <Package className="mb-3 size-8 text-muted-foreground/50" />
                                <p className="text-sm font-medium text-foreground">
                                    No suppliers match this search
                                </p>
                                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                                    {hasActiveFilters
                                        ? 'Clear the filters to see every approved supplier.'
                                        : 'No approved suppliers are listed in this area yet.'}
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                    {stores.data.map((store) => (
                                        <Link
                                            key={store.id}
                                            href={storesShow(store.id)}
                                            className="group flex flex-col rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
                                            onMouseEnter={() =>
                                                setHoveredStoreId(store.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredStoreId(null)
                                            }
                                        >
                                            {/* Name + availability */}
                                            <div className="mb-2 flex items-start justify-between gap-2">
                                                <h2 className="text-sm leading-snug font-semibold text-foreground group-hover:text-primary">
                                                    {store.name}
                                                </h2>
                                                <StockLevel
                                                    state={
                                                        store.store_availability
                                                    }
                                                    size="md"
                                                    className="shrink-0"
                                                />
                                            </div>

                                            {/* Address + distance */}
                                            <div className="mb-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                                                <MapPin className="mt-0.5 size-3 shrink-0" />
                                                <span className="line-clamp-1">
                                                    {store.address}
                                                </span>
                                                {store.distance_km !== null && (
                                                    <span className="ml-auto shrink-0 font-display font-semibold tracking-wide text-foreground tabular-nums">
                                                        {store.distance_km} km
                                                    </span>
                                                )}
                                            </div>

                                            {/* Type badge */}
                                            {store.type && (
                                                <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Truck className="size-3 shrink-0" />
                                                    <span>
                                                        {
                                                            TYPE_LABELS[
                                                                store.type
                                                            ]
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {store.description && (
                                                <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">
                                                    {store.description}
                                                </p>
                                            )}

                                            {/* Footer */}
                                            <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Package className="size-3" />
                                                    {store.products_count}{' '}
                                                    {store.products_count === 1
                                                        ? 'product'
                                                        : 'products'}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    {priceRange(
                                                        store.price_min,
                                                        store.price_max,
                                                    ) && (
                                                        <span className="font-display text-sm font-bold text-foreground tabular-nums">
                                                            {priceRange(
                                                                store.price_min,
                                                                store.price_max,
                                                            )}
                                                        </span>
                                                    )}
                                                    {relativeTime(
                                                        store.last_updated_at,
                                                    ) && (
                                                        <span>
                                                            {relativeTime(
                                                                store.last_updated_at,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {stores.last_page > 1 && (
                                    <div className="mt-6 flex items-center justify-center gap-1">
                                        {stores.links.map((link, i) => (
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
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                                preserveState
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Map column — sticky on desktop, hidden on mobile list view */}
                    <div className="hidden w-[480px] shrink-0 lg:block xl:w-[560px]">
                        <div className="sticky top-4">{mapPanel}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
