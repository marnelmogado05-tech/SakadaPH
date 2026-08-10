import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    value: number;
    /** When provided, the widget is interactive. */
    onChange?: (rating: number) => void;
    size?: number;
    className?: string;
};

/**
 * A 1–5 star rating widget. Read-only when no `onChange` is passed.
 */
export function StarRating({ value, onChange, size = 20, className }: Props) {
    const [hover, setHover] = useState<number | null>(null);
    const interactive = typeof onChange === 'function';
    const active = hover ?? value;

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= active;
                const StarIcon = (
                    <Star
                        style={{ width: size, height: size }}
                        className={
                            filled
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-transparent text-muted-foreground/40'
                        }
                    />
                );

                if (!interactive) {
                    return <span key={star}>{StarIcon}</span>;
                }

                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange?.(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(null)}
                        className="transition-transform hover:scale-110"
                        aria-label={`${star} star${star === 1 ? '' : 's'}`}
                    >
                        {StarIcon}
                    </button>
                );
            })}
        </div>
    );
}
