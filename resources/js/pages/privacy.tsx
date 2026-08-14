import { Head } from '@inertiajs/react';

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy">
                <meta
                    name="description"
                    content="Privacy Policy for Sakada PH."
                />
            </Head>

            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Privacy Policy
                </h1>
                <p className="mb-8 text-sm text-muted-foreground">
                    Last updated: August 13, 2026
                </p>

                <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            1. Introduction
                        </h2>
                        <p>
                            This Privacy Policy explains how Sakada PH collects,
                            uses, and protects your personal information, in
                            line with the Data Privacy Act of 2012 (Republic Act
                            No. 10173) and its implementing rules.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            2. Information we collect
                        </h2>
                        <p>
                            We collect information you provide directly,
                            including:
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            <li>Account details (name, email, phone number)</li>
                            <li>
                                Delivery address and, if you allow it, location
                                data to find nearby suppliers
                            </li>
                            <li>Order history and order details</li>
                            <li>
                                GCash payment reference numbers you submit for
                                an order
                            </li>
                            <li>
                                For sellers: store details and uploaded
                                documents such as GCash QR codes used to receive
                                payment
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            3. How we use your information
                        </h2>
                        <p>
                            We use your information to operate the Platform:
                            matching you with nearby suppliers, processing and
                            tracking orders, enabling communication between
                            buyers and sellers, and maintaining account
                            security.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            4. Sharing your information
                        </h2>
                        <p>
                            When you place an order, relevant details (name,
                            delivery address, order contents, GCash reference
                            number) are shared with the Seller you're ordering
                            from so they can fulfill your order. We do not sell
                            your personal information to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            5. Cookies
                        </h2>
                        <p>
                            We use essential cookies to keep you signed in and
                            to remember your session while using the Platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            6. Data retention
                        </h2>
                        <p>
                            We retain account and order information for as long
                            as your account is active, or as needed to comply
                            with legal obligations, resolve disputes, and
                            enforce our agreements.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            7. Your rights
                        </h2>
                        <p>
                            Under the Data Privacy Act of 2012, you have the
                            right to be informed, to access, to object, to
                            correct, and to erase or block your personal data,
                            as well as the right to data portability and to
                            lodge a complaint with the National Privacy
                            Commission. To exercise these rights, contact us
                            using the details below.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            8. Security
                        </h2>
                        <p>
                            We apply reasonable technical and organizational
                            measures to protect your personal information. No
                            system is completely secure, and we cannot guarantee
                            absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            9. Changes to this policy
                        </h2>
                        <p>
                            We may update this Privacy Policy from time to time.
                            We will update the "Last updated" date above when we
                            do.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-2 text-base font-semibold text-foreground">
                            10. Contact us
                        </h2>
                        <p>
                            For questions or requests regarding your personal
                            data, contact us at{' '}
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
