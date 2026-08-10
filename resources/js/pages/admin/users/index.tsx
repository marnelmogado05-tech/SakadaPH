import { Form, Head, Link, router } from '@inertiajs/react';
import { Search, ShieldBan, ShieldCheck } from 'lucide-react';
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
import { index as usersIndex, ban, unban } from '@/routes/admin/users';

type User = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: 'user' | 'seller';
    contact_number: string | null;
    banned_at: string | null;
    ban_reason: string | null;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedUsers = {
    data: User[];
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
    users: PaginatedUsers;
    filters: Filters;
};

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'banned', label: 'Banned' },
];

function BanDialog({ user }: { user: User }) {
    const [reason, setReason] = useState('');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                >
                    <ShieldBan className="mr-1.5 size-3.5" />
                    Ban
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>
                    Ban {user.first_name} {user.last_name}
                </DialogTitle>
                <DialogDescription>
                    This user will be immediately logged out and unable to log
                    in.
                </DialogDescription>
                <Form
                    action={ban.url(user.id)}
                    method="post"
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor={`ban-reason-${user.id}`}>
                                    Reason
                                </Label>
                                <Textarea
                                    id={`ban-reason-${user.id}`}
                                    name="reason"
                                    rows={3}
                                    required
                                    placeholder="e.g. Violation of community guidelines"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                {errors.reason && (
                                    <p className="text-sm text-destructive">
                                        {errors.reason}
                                    </p>
                                )}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing || !reason.trim()}
                                >
                                    {processing && <Spinner />}
                                    Confirm ban
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminUsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    function applyFilter(overrides: Partial<Filters> = {}) {
        router.get(
            usersIndex(),
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
            <Head title="Users" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">
                        Users
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage consumer and seller accounts.
                    </p>
                </div>

                {/* Search + status filter */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by name or email…"
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-1">
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
                    <p className="ml-auto text-sm text-muted-foreground">
                        {users.total} {users.total === 1 ? 'user' : 'users'}
                    </p>
                </div>

                {/* User table */}
                {users.data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No users match the current filter.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                        Joined
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={
                                            user.banned_at
                                                ? 'bg-red-50/40 dark:bg-red-950/10'
                                                : ''
                                        }
                                    >
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {user.first_name} {user.last_name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {user.email}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.banned_at ? (
                                                <div>
                                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        Banned
                                                    </Badge>
                                                    {user.ban_reason && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {user.ban_reason}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    Active
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {user.created_at}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {user.banned_at ? (
                                                <Form
                                                    action={unban.url(user.id)}
                                                    method="post"
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                processing
                                                            }
                                                            className="text-green-700 hover:text-green-700"
                                                        >
                                                            {processing ? (
                                                                <Spinner />
                                                            ) : (
                                                                <ShieldCheck className="mr-1.5 size-3.5" />
                                                            )}
                                                            Unban
                                                        </Button>
                                                    )}
                                                </Form>
                                            ) : (
                                                <BanDialog user={user} />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center gap-1">
                        {users.links.map((link, i) => (
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

AdminUsersIndex.layout = {
    breadcrumbs: [{ title: 'Users', href: usersIndex() }],
};
