import { Head, Link } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { logout } from '@/routes';

export default function SellerSuspended() {
    return (
        <>
            <Head title="Account Suspended" />

            <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
                <div className="w-full max-w-sm text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
                            <ShieldOff className="h-7 w-7 text-destructive" />
                        </div>
                    </div>

                    <h1 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
                        Account suspended
                    </h1>
                    <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
                        Your store has been suspended and is no longer visible to customers. Please
                        contact our support team if you believe this is a mistake or to resolve the
                        issue.
                    </p>

                    <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-left text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">What can you do?</p>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>• Review the suspension reason sent to your email</li>
                            <li>• Contact support to appeal or resolve the issue</li>
                            <li>• Once reinstated, your store will go live again</li>
                        </ul>
                    </div>

                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                        Log out
                    </Link>
                </div>
            </div>
        </>
    );
}
