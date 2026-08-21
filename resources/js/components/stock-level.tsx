import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Stock states shown to users. The first three mirror the backend
 * `ProductAvailability` enum; `no_products` is the store-level case where a
 * seller has not listed anything yet.
 */
export type StockState =
    'in_stock' | 'low_stock' | 'out_of_stock' | 'no_products';

type StockSize = 'sm' | 'md' | 'lg';

type Props = {
    state: StockState;
    /** @default 'md' */
    size?: StockSize;
    /** @default true */
    showLabel?: boolean;
    /** Secondary line under the label, e.g. "6 products". */
    sublabel?: string | null;
    className?: string;
};

/**
 * Silhouette of the five-gallon jug the trade runs on, drawn once at
 * 58x76 and scaled per size.
 */
const JUG_PATH =
    'M22 3h14v7c0 2 1 3 3 4l7 4c3 2 5 5 5 9v40c0 4-3 7-7 7H14c-4 0-7-3-7-7V27c0-4 2-7 5-9l7-4c2-1 3-2 3-4z';

/**
 * Water height inside the jug, in the 0-76 viewBox. Fill height is the signal
 * that reads first — colour only reinforces it, so the mark still works in
 * sunlight and for colour-blind users.
 */
const STOCK_CONFIG: Record<
    StockState,
    { label: string; colorClass: string; fillY: number | null; dashed: boolean }
> = {
    in_stock: {
        label: 'In stock',
        colorClass: 'text-stock-full',
        fillY: 14,
        dashed: false,
    },
    low_stock: {
        label: 'Low stock',
        colorClass: 'text-stock-low',
        fillY: 46,
        dashed: false,
    },
    out_of_stock: {
        label: 'Out of stock',
        colorClass: 'text-stock-empty',
        fillY: null,
        dashed: true,
    },
    no_products: {
        label: 'No products',
        colorClass: 'text-stock-none',
        fillY: null,
        dashed: false,
    },
};

const SIZES: Record<StockSize, { w: number; h: number; text: string }> = {
    sm: { w: 14, h: 18, text: 'text-xs' },
    md: { w: 20, h: 26, text: 'text-sm' },
    lg: { w: 30, h: 39, text: 'text-base' },
};

export function stockLabel(state: StockState): string {
    return STOCK_CONFIG[state].label;
}

/**
 * The single renderer for stock availability across the app — store cards,
 * product rows, store profiles and map popups all use this so the list and
 * the map can never disagree.
 */
export default function StockLevel({
    state,
    size = 'md',
    showLabel = true,
    sublabel,
    className,
}: Props) {
    const clipId = useId();
    const config = STOCK_CONFIG[state];
    const { w, h, text } = SIZES[size];

    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <svg
                width={w}
                height={h}
                viewBox="0 0 58 76"
                className={cn('shrink-0', config.colorClass)}
                role={showLabel ? undefined : 'img'}
                aria-label={showLabel ? undefined : config.label}
                aria-hidden={showLabel ? true : undefined}
            >
                <defs>
                    <clipPath id={clipId}>
                        <path d={JUG_PATH} />
                    </clipPath>
                </defs>
                <g clipPath={`url(#${clipId})`}>
                    <rect
                        width="58"
                        height="76"
                        fill="currentColor"
                        opacity="0.16"
                    />
                    {config.fillY !== null && (
                        <rect
                            y={config.fillY}
                            width="58"
                            height={76 - config.fillY}
                            fill="currentColor"
                        />
                    )}
                </g>
                <path
                    d={JUG_PATH}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={config.dashed ? '5 4' : undefined}
                />
            </svg>

            {showLabel && (
                <span className="min-w-0">
                    <span
                        className={cn('font-medium', text, config.colorClass)}
                    >
                        {config.label}
                    </span>
                    {sublabel && (
                        <span className="block text-xs text-muted-foreground">
                            {sublabel}
                        </span>
                    )}
                </span>
            )}
        </span>
    );
}
