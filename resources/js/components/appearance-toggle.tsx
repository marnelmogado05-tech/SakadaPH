import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const options: { value: Appearance; icon: LucideIcon; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light theme' },
    { value: 'dark', icon: Moon, label: 'Dark theme' },
    { value: 'system', icon: Monitor, label: 'System theme' },
];

function expandFromOrigin(x: number, y: number, applyTheme: () => void) {
    if (!document.startViewTransition) {
        applyTheme();

        return;
    }

    const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
        flushSync(applyTheme);
    });

    transition.ready.then(() => {
        document.documentElement.animate(
            {
                clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
            },
            {
                duration: 600,
                easing: 'ease-in-out',
                pseudoElement: '::view-transition-new(root)',
            },
        );
    });
}

export function AppearanceToggle() {
    const { appearance, updateAppearance } = useAppearance();

    const handleClick = (
        event: MouseEvent<HTMLButtonElement>,
        value: Appearance,
    ) => {
        if (value === appearance) {
            return;
        }

        const { clientX, clientY } = event;

        expandFromOrigin(clientX, clientY, () => updateAppearance(value));
    };

    const current = options.find((option) => option.value === appearance)!;

    const handleCycleClick = (event: MouseEvent<HTMLButtonElement>) => {
        const currentIndex = options.findIndex(
            (option) => option.value === appearance,
        );
        const next = options[(currentIndex + 1) % options.length];

        handleClick(event, next.value);
    };

    return (
        <>
            {/* Compact single button that cycles light -> dark -> system, for narrow viewports */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        aria-label={current.label}
                        onClick={handleCycleClick}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:hidden"
                    >
                        <current.icon className="size-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{current.label}</p>
                </TooltipContent>
            </Tooltip>

            {/* Full segmented group once there's room */}
            <div className="hidden items-center gap-1 rounded-lg border border-border/60 p-1 sm:flex">
                {options.map(({ value, icon: Icon, label }) => (
                    <Tooltip key={value}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label={label}
                                aria-pressed={appearance === value}
                                onClick={(event) => handleClick(event, value)}
                                className={cn(
                                    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
                                    appearance === value
                                        ? 'bg-secondary text-foreground'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                )}
                            >
                                <Icon className="size-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{label}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </>
    );
}
