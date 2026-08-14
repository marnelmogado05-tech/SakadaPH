import { Head } from '@inertiajs/react';

export default function Terms() {
    return (
        <>
            <Head title="Terms of Service">
                <meta
                    name="description"
                    content="Terms of Service for Sakada PH."
                />
            </Head>

            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Terms of Service
                </h1>
                <p className="mb-8 text-sm text-muted-foreground">
                    Last updated: August 13, 2026
                </p>

                <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            1. Acceptance of terms
                        </h2>
                        <p>
                            By creating an account or using Sakada PH ("the
                            Platform"), you agree to these Terms of Service.
                            If you do not agree, do not use the Platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            2. What Sakada PH is
                        </h2>
                        <p>
                            Sakada PH is a marketplace that connects buyers
                            with independent water suppliers ("Sellers").
                            Sakada PH does not itself sell, deliver, or
                            guarantee the quality of water products. Each
                            Seller is responsible for their own products,
                            pricing, stock accuracy, and fulfillment.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            3. Accounts
                        </h2>
                        <p>
                            You must provide accurate information when
                            registering and are responsible for keeping your
                            account credentials secure. You are responsible
                            for all activity under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            4. Orders and payment
                        </h2>
                        <p>
                            Orders are placed directly with a Seller through
                            the Platform. Supported payment methods include
                            GCash and cash on delivery/pickup, depending on
                            what the Seller accepts. For GCash payments, you
                            are responsible for submitting an accurate
                            reference number; Sakada PH is not a party to the
                            payment transaction itself and does not process
                            or hold funds.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            5. Seller obligations
                        </h2>
                        <p>
                            Sellers must keep product listings, pricing, and
                            stock availability accurate, and must fulfill
                            confirmed orders in good faith. Sakada PH may
                            review, suspend, or remove a Seller's store for
                            violations of these Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            6. Prohibited conduct
                        </h2>
                        <p>
                            You may not use the Platform to submit false
                            information, misrepresent stock or pricing,
                            harass other users, or attempt to circumvent
                            Platform safeguards.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            7. Limitation of liability
                        </h2>
                        <p>
                            Sakada PH provides the Platform "as is" and is not
                            liable for disputes, losses, or damages arising
                            from transactions between buyers and Sellers,
                            including product quality, delivery delays, or
                            payment issues.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            8. Termination
                        </h2>
                        <p>
                            We may suspend or terminate accounts that violate
                            these Terms. You may stop using the Platform and
                            request account deletion at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            9. Changes to these terms
                        </h2>
                        <p>
                            We may update these Terms from time to time. We
                            will update the "Last updated" date above when we
                            do.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            10. Governing law
                        </h2>
                        <p>
                            These Terms are governed by the laws of the
                            Republic of the Philippines.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            11. Contact
                        </h2>
                        <p>
                            Questions about these Terms can be sent to{' '}
                            <a
                                href="mailto:support@sakada.ph"
                                className="text-foreground underline underline-offset-2"
                            >
                                support@sakada.ph
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
