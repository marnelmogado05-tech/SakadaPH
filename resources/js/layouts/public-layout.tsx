import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { AppearanceToggle } from '@/components/appearance-toggle';
import {
    about,
    contact,
    dashboard,
    howToUse,
    login,
    notifications as notificationsRoute,
    privacy,
    register,
    terms,
} from '@/routes';

export default function PublicLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b border-border/60">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 sm:gap-2.5"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
                            <AppLogoIcon className="size-8 object-contain" />
                        </div>
                        <span className="text-base font-semibold tracking-tight whitespace-nowrap text-foreground">
                            Sakada PH
                        </span>
                    </Link>

                    <nav className="flex items-center gap-1.5 sm:gap-3">
                        <AppearanceToggle />
                        {auth.user ? (
                            <>
                                {auth.user.role === 'user' && (
                                    <Link
                                        href={notificationsRoute()}
                                        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                        aria-label="Notifications"
                                    >
                                        <Bell className="size-5" />
                                        {auth.notifications_count > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                                                {auth.notifications_count > 99
                                                    ? '99+'
                                                    : auth.notifications_count}
                                            </span>
                                        )}
                                    </Link>
                                )}
                                <Link
                                    href={dashboard()}
                                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-opacity hover:opacity-90 sm:px-4"
                                >
                                    Dashboard
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-opacity hover:opacity-90 sm:px-4"
                                >
                                    Get started
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex flex-1 flex-col">{children}</main>

            <footer className="border-t border-border/60">
                <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-6">
                    <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        <Link
                            href={about()}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            About
                        </Link>
                        <Link
                            href={contact()}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Contact
                        </Link>
                        <Link
                            href={howToUse()}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            How to Use
                        </Link>
                        <Link
                            href={terms()}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href={privacy()}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Privacy Policy
                        </Link>
                    </nav>
                    <p className="text-center text-sm text-muted-foreground">
                        &copy; 2026 Sakada PH. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
