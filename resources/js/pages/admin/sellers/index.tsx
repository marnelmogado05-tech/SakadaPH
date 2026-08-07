import { Form, Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes/admin';
import { index as sellersIndex, approve, reject, suspend, unsuspend } from '@/routes/admin/sellers';

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

function StatusBadge({ status }: { status: Store['status'] }) {
    if (status === 'approved') {
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
    }

    if (status === 'rejected') {
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
    }

    if (status === 'suspended') {
        return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Suspended</Badge>;
    }

    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
}

function RejectDialog({ store }: { store: Store }) {
    const [reason, setReason] = useState('');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    Reject
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Reject "{store.name}"</DialogTitle>
                <DialogDescription>Provide a reason for rejection. This will be emailed to the seller.</DialogDescription>
                <Form action={reject.url(store.id)} method="post" className="space-y-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor={`reason-${store.id}`}>Reason</Label>
                                <Textarea
                                    id={`reason-${store.id}`}
                                    name="reason"
                                    rows={3}
                                    required
                                    placeholder="e.g. Missing business permit information"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" variant="destructive" disabled={processing || !reason.trim()}>
                                    {processing && <Spinner />}
                                    Confirm rejection
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function SuspendDialog({ store }: { store: Store }) {
    const [reason, setReason] = useState('');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-600">
                    Suspend
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Suspend "{store.name}"</DialogTitle>
                <DialogDescription>
                    This store will be hidden from customers and the seller will be locked out of their dashboard.
                </DialogDescription>
                <Form action={suspend.url(store.id)} method="post" className="space-y-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor={`suspend-${store.id}`}>Reason</Label>
                                <Textarea
                                    id={`suspend-${store.id}`}
                                    name="reason"
                                    rows={3}
                                    required
                                    placeholder="e.g. Violation of terms of service"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={processing || !reason.trim()}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    {processing && <Spinner />}
                                    Confirm suspension
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminSellersIndex({ stores, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    function applyFilter(overrides: Partial<Filters> = {}) {
        router.get(
            sellersIndex(),
            {
                search: (overrides.search ?? search) || undefined,
                status: (overrides.status !== undefined ? overrides.status : filters.status) || undefined,
            },
            { preserveScroll: true, replace: true },
        );
    }

    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    function handleSearch(value: string) {
        setSearch(value);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => applyFilter({ search: value }), 350);
    }

    return (
        <>
            <Head title="Sellers" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">Sellers</h1>
                    <p className="text-sm text-muted-foreground">Manage seller applications and approved stores.</p>
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
                    <div className="flex items-center gap-1">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => applyFilter({ status: opt.value })}
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
                    <p className="text-sm text-muted-foreground">No stores match the current filter.</p>
                ) : (
                    <div className="grid gap-3">
                        {stores.data.map((store) => (
                            <div
                                key={store.id}
                                className={[
                                    'flex items-start justify-between gap-4 rounded-lg border bg-card p-4',
                                    store.is_stale ? 'border-amber-200 dark:border-amber-900/60' : 'border-border',
                                ].join(' ')}
                            >
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-foreground">{store.name}</p>
                                        {store.is_stale && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                                <AlertTriangle className="size-3" />
                                                Stale
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{store.address}</p>
                                    {store.description && (
                                        <p className="text-sm text-muted-foreground">{store.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {store.seller.first_name} {store.seller.last_name} — {store.seller.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Applied {store.created_at}</p>
                                    {store.rejection_reason && (
                                        <p className="text-xs text-destructive">Reason: {store.rejection_reason}</p>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <StatusBadge status={store.status} />

                                    {store.status === 'pending' && (
                                        <>
                                            <Form action={approve.url(store.id)} method="post">
                                                {({ processing }) => (
                                                    <Button type="submit" size="sm" disabled={processing}>
                                                        {processing && <Spinner />}
                                                        Approve
                                                    </Button>
                                                )}
                                            </Form>
                                            <RejectDialog store={store} />
                                        </>
                                    )}

                                    {store.status === 'approved' && <SuspendDialog store={store} />}

                                    {store.status === 'suspended' && (
                                        <Form action={unsuspend.url(store.id)} method="post">
                                            {({ processing }) => (
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={processing}
                                                    className="text-green-700 hover:text-green-700"
                                                >
                                                    {processing && <Spinner />}
                                                    Reinstate
                                                </Button>
                                            )}
                                        </Form>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {stores.last_page > 1 && (
                    <div className="flex items-center gap-1">
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
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Sellers', href: sellersIndex() },
    ],
};
