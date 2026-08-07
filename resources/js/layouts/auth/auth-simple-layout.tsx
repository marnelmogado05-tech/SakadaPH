import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12 sm:px-6">
            <div className="w-full max-w-sm">
                <div className="mb-8 flex flex-col items-center gap-6">
                    <Link href={home()} className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
                            <AppLogoIcon className="size-[18px] object-contain" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-foreground">
                            Sakada PH
                        </span>
                    </Link>

                    <div className="space-y-1.5 text-center">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}
