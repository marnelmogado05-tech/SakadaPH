import { cn } from '@/lib/utils';

/**
 * The order lifecycle, mirroring the backend `OrderStatus` enum.
 */
export type OrderState =
    | 'pending_payment'
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready_for_pickup'
    | 'out_for_delivery'
    | 'completed'
    | 'cancelled'
    | 'rejected';

type Tone = 'wait' | 'move' | 'done' | 'stop';

type Props = {
    state: OrderState;
    /**
     * The server's own wording for the state, so the copy lives in one place
     * (the PHP enum). Falls back to a local label if omitted.
     */
    label?: string;
    /** `track` shows progress; `chip` is the compact label for tight rows. */
    variant?: 'track' | 'chip';
    className?: string;
};

/**
 * How far along the fulfilment path each state sits, out of {@link STEPS}.
 *
 * The backend models this as a real sequence (`OrderStatusService::transitionMap`),
 * so the interface encodes distance travelled rather than giving four different
 * stages the same coloured pill. `cancelled` and `rejected` stop the track
 * instead of pretending to progress.
 */
const STEPS = 4;

const LIFECYCLE: Record<
    OrderState,
    { step: number; tone: Tone; label: string }
> = {
    pending_payment: { step: 0, tone: 'wait', label: 'Awaiting payment' },
    pending: { step: 0, tone: 'wait', label: 'Pending confirmation' },
    confirmed: { step: 1, tone: 'move', label: 'Confirmed' },
    preparing: { step: 2, tone: 'move', label: 'Preparing' },
    ready_for_pickup: { step: 3, tone: 'move', label: 'Ready for pickup' },
    out_for_delivery: { step: 3, tone: 'move', label: 'Out for delivery' },
    completed: { step: 4, tone: 'done', label: 'Completed' },
    cancelled: { step: 0, tone: 'stop', label: 'Cancelled' },
    rejected: { step: 0, tone: 'stop', label: 'Rejected' },
};

const TONE_TEXT: Record<Tone, string> = {
    wait: 'text-attention',
    move: 'text-order-move',
    done: 'text-order-done',
    stop: 'text-order-stop',
};

const TONE_FILL: Record<Tone, string> = {
    wait: 'bg-attention',
    move: 'bg-order-move',
    done: 'bg-order-done',
    stop: 'bg-order-stop',
};

export function orderStateLabel(state: OrderState): string {
    return LIFECYCLE[state]?.label ?? state;
}

/**
 * The single renderer for order state — consumer dashboard, consumer orders,
 * the seller's queue and the admin list all use this, so the four in-progress
 * stages can never collapse into one indistinguishable colour again.
 */
export default function OrderStatus({
    state,
    label,
    variant = 'track',
    className,
}: Props) {
    const config = LIFECYCLE[state] ?? LIFECYCLE.pending;
    const text = label ?? config.label;
    const stopped = config.tone === 'stop';

    if (variant === 'chip') {
        return (
            <span
                className={cn(
                    'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    // Only the state that needs a person carries a filled
                    // background; everything else stays quiet.
                    config.tone === 'wait'
                        ? 'bg-attention-wash text-attention'
                        : cn('bg-secondary', TONE_TEXT[config.tone]),
                    className,
                )}
            >
                {text}
            </span>
        );
    }

    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <span
                className="flex w-20 shrink-0 items-center gap-[3px]"
                role="img"
                aria-label={`${text} — step ${config.step} of ${STEPS}`}
            >
                {Array.from({ length: STEPS }, (_, i) => {
                    const filled = stopped ? i === 0 : i < config.step;

                    return (
                        <span
                            key={i}
                            className={cn(
                                'h-[5px] flex-1 rounded-full',
                                filled
                                    ? TONE_FILL[config.tone]
                                    : 'bg-secondary',
                            )}
                        />
                    );
                })}
            </span>
            <span
                className={cn(
                    'text-xs font-semibold whitespace-nowrap',
                    TONE_TEXT[config.tone],
                )}
            >
                {text}
            </span>
        </span>
    );
}
