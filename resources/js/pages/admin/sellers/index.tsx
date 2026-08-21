import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import ConfirmDialog from '@/components/confirm-dialog';
import StatusBadge from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import {
    index as sellersIndex,
    approve,
    reject,
    suspend,
    unsuspend,
} from '@/routes/admin/sellers';

type Seller = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    contact_number: string | null;
};

type Store = {
    id: number;
    name: string;
    address: string;
    description: string | null;
    contact_number: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    rejection_reason: string | null;
    is_stale: boolean;
    created_at: string;
    seller: Seller;
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
    status: string;
};

type Props = {
    stores: PaginatedStores;
    filters: Filters;
};

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' },
];

export default function AdminSellersIndex({ stores, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    function applyFilter(overrides: Partial<Filters> = {}) {
        router.get(
            sellersIndex(),
            {
                search: (overrides.search ?? search) || undefined,
                status:
                    (overrides.status !== undefined
                        ? overrides.status
                        : filters.status) || undefined,
            },
            { preserveScroll: true, replace: true },
        );
    }

    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    function handleSearch(value: string) {
        setSearch(value);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(
            () => applyFilter({ search: value }),
            350,
        );
    }

    return (
        <>
            <Head title="Sellers" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">
                        Sellers
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage seller applications and approved stores.
                    </p>
                </div>

                {/* Search + status filter */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by name or address…"
                            className="pl-9"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                    applyFilter({ status: opt.value })
                                }
                                className={[
                                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                    filters.status === opt.value
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                                ].join(' ')}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Store list */}
                {stores.data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No stores match the current filter.
                    </p>
                ) : (
                    <div className="grid gap-3">
                        {stores.data.map((store) => (
                            <div
                                key={store.id}
                                className={[
                                    'flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row',
                                    store.is_stale
                                        ? 'border-attention/40'
                                        : 'border-border',
                                ].join(' ')}
                            >
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-foreground">
                                            {store.name}
                                        </p>
                                        {store.is_stale && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-attention-wash px-2 py-0.5 text-xs font-medium text-attention">
                                                <AlertTriangle className="size-3" />
                                                Stale
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {store.address}
                                    </p>
                                    {store.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {store.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {store.seller.first_name}{' '}
                                        {store.seller.last_name} —{' '}
                                        {store.seller.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Applied {store.created_at}
                                    </p>
                                    {store.rejection_reason && (
                                        <p className="text-xs text-destructive">
                                            Reason: {store.rejection_reason}
                                        </p>
                                    )}
                                </div>

                                <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
                                    <StatusBadge standing={store.status} />

                                    {store.status === 'pending' && (
                                        <>
                                            <ConfirmDialog
                                                id={`approve-${store.id}`}
                                                action={approve.url(store.id)}
                                                triggerLabel="Approve"
                                                title={`Approve "${store.name}"`}
                                                description="The store becomes visible to customers and can start taking orders straight away. The seller is emailed that they have been approved."
                                                confirmLabel="Approve store"
                                                tone="constructive"
                                            />
                                            <ConfirmDialog
                                                id={`reject-${store.id}`}
                                                action={reject.url(store.id)}
                                                triggerLabel="Reject"
                                                title={`Reject "${store.name}"`}
                                                description="The seller is emailed the reason and their store stays off the marketplace."
                                                confirmLabel="Reject application"
                                                tone="destructive"
                                                reason={{
                                                    placeholder:
                                                        'e.g. Missing business permit information',
                                                }}
                                            />
                                        </>
                                    )}

                                    {store.status === 'approved' && (
                                        <ConfirmDialog
                                            id={`suspend-${store.id}`}
                                            action={suspend.url(store.id)}
                                            triggerLabel="Suspend"
                                            title={`Suspend "${store.name}"`}
                                            description="The store is hidden from customers and the seller loses access to their dashboard until reinstated."
                                            confirmLabel="Suspend store"
                                            tone="caution"
                                            reason={{
                                                placeholder:
                                                    'e.g. Violation of terms of service',
                                            }}
                                        />
                                    )}

                                    {store.status === 'suspended' && (
                                        <ConfirmDialog
                                            id={`reinstate-${store.id}`}
                                            action={unsuspend.url(store.id)}
                                            triggerLabel="Reinstate"
                                            title={`Reinstate "${store.name}"`}
                                            description="The store becomes visible to customers again and the seller regains access to their dashboard."
                                            confirmLabel="Reinstate store"
                                            tone="constructive"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {stores.last_page > 1 && (
                    <div className="flex flex-wrap items-center gap-1">
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

AdminSellersIndex.layout = {
    breadcrumbs: [{ title: 'Sellers', href: sellersIndex() }],
};
