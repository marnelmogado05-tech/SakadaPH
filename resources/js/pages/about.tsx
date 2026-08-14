import { Head, Link } from '@inertiajs/react';
import { register as sellerRegister } from '@/routes/seller';
import { index as storesIndex } from '@/routes/stores';

export default function About() {
    return (
        <>
            <Head title="About">
                <meta
                    name="description"
                    content="Sakada PH connects Filipino households with trusted local water suppliers — live stock, transparent pricing, and easy delivery or pickup."
                />
            </Head>

            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    About Sakada PH
                </h1>
                <p className="mb-12 text-base leading-relaxed text-muted-foreground">
                    Sakada PH is a marketplace that connects Filipino households
                    with trusted local water suppliers.
                </p>

                <div className="space-y-10">
                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-foreground">
                            The problem we're solving
                        </h2>
                        <p className="leading-relaxed text-muted-foreground">
                            Finding a water refilling station or supplier with
                            stock on hand often means calling around or making a
                            wasted trip. Sakada PH shows you which suppliers
                            near you actually have stock right now, so you can
                            order with confidence instead of guessing.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-foreground">
                            What you can do
                        </h2>
                        <p className="leading-relaxed text-muted-foreground">
                            Browse nearby water suppliers on a map, compare
                            prices and live availability, and place an order for
                            delivery or pickup. Suppliers manage their own
                            store, products, and orders directly on the
                            platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-lg font-semibold text-foreground">
                            For suppliers
                        </h2>
                        <p className="leading-relaxed text-muted-foreground">
                            If you run a water refilling station or delivery
                            business, listing on Sakada PH puts you in front of
                            customers actively searching for water near them —
                            no separate app or ordering system to maintain.
                        </p>
                    </section>
                </div>

                <div className="mt-14 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href={storesIndex()}
                        className="rounded-lg bg-primary px-6 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        Find suppliers near me
                    </Link>
                    <Link
                        href={sellerRegister()}
                        className="rounded-lg border border-border px-6 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                        List your business
                    </Link>
                </div>
            </div>
        </>
    );
}
