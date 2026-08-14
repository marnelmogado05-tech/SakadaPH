import { Head, Link } from '@inertiajs/react';
import { register as sellerRegister } from '@/routes/seller';
import { index as storesIndex } from '@/routes/stores';

export default function Welcome() {
    return (
        <>
            <Head title="Sakada PH — Find Water Near You">
                <meta
                    name="description"
                    content="Find trusted water suppliers near you in the Philippines. Compare prices, check live stock availability, and get delivery or pickup from local water refilling stations."
                />
                <meta
                    property="og:title"
                    content="Sakada PH — Find Water Near You"
                />
                <meta
                    property="og:description"
                    content="Find trusted water suppliers near you in the Philippines. Compare prices, check live stock availability, and get delivery or pickup from local water refilling stations."
                />
                <meta property="og:type" content="website" />
            </Head>

            {/* Hero */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
                <div className="max-w-xl">
                    <span className="mb-5 inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                        Now available in the Philippines
                    </span>

                    <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                        Find water suppliers
                        <br />
                        near you.
                    </h1>

                    <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Sakada connects you with trusted local water suppliers.
                        No more wasted trips — see who has stock available right
                        now.
                    </p>

                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href={storesIndex()}
                            className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
                        >
                            Find suppliers near me
                        </Link>
                        <Link
                            href={sellerRegister()}
                            className="w-full rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:w-auto"
                        >
                            List your business
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
