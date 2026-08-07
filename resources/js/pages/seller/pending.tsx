import { Head, Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { logout } from '@/routes';

export default function SellerPending() {
    return (
        <>
            <Head title="Application Under Review" />

            <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
                <div className="w-full max-w-sm text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                            <Clock className="h-7 w-7 text-primary" />
                        </div>
                    </div>

                    <h1 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
                        Application under review
                    </h1>
                    <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
                        Your store registration has been received and is being reviewed by our team.
                        We'll notify you by email once a decision has been made. This usually takes
                        1–2 business days.
                    </p>

                    <div className="mb-6 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-left text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">What happens next?</p>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>• Our team reviews your store details</li>
                            <li>• You receive an email notification</li>
                            <li>• Once approved, you can access your dashboard</li>
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
