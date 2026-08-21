import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Standing of a store or an account, as distinct from stock level or order
 * lifecycle. `pending` and `suspended` borrow the attention colour because
 * both mean something is waiting on a person.
 */
export type Standing =
    'pending' | 'approved' | 'rejected' | 'suspended' | 'active' | 'banned';

const STANDING: Record<Standing, { label: string; className: string }> = {
    pending: {
        label: 'Pending',
        className: 'bg-attention-wash text-attention',
    },
    approved: {
        label: 'Approved',
        className: 'bg-status-active-wash text-status-active',
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-status-blocked-wash text-status-blocked',
    },
    suspended: {
        label: 'Suspended',
        className: 'bg-attention-wash text-attention',
    },
    active: {
        label: 'Active',
        className: 'bg-status-active-wash text-status-active',
    },
    banned: {
        label: 'Banned',
        className: 'bg-status-blocked-wash text-status-blocked',
    },
};

/**
 * The single renderer for standing across the admin screens.
 */
export default function StatusBadge({
    standing,
    className,
}: {
    standing: Standing;
    className?: string;
}) {
    const config = STANDING[standing];

    return (
        <Badge className={cn(config.className, className)}>
            {config.label}
        </Badge>
    );
}
