import { Head, Link } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';

export default function Banned() {
    return (
        <>
            <Head title="Account Suspended" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <ShieldOff className="size-8 text-destructive" />
                </div>
                <h1 className="mb-2 text-xl font-semibold text-foreground">
                    Account suspended
                </h1>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                    Your account has been suspended. If you believe this is a
                    mistake, please contact support.
                </p>
                <Link
                    href="/"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                    Return to home
                </Link>
            </div>
        </>
    );
}
