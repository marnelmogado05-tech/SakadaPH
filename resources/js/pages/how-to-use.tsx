import { Head, Link } from '@inertiajs/react';
import { register as sellerRegister } from '@/routes/seller';
import { index as storesIndex } from '@/routes/stores';

const orderingSteps = [
    {
        title: 'Find a supplier near you',
        description:
            'Browse the map or list of water suppliers, filter by location, and check who has stock available right now.',
    },
    {
        title: 'Add products to your cart',
        description:
            'Open a store, compare prices, and add the water products you need.',
    },
    {
        title: 'Checkout',
        description:
            'Choose delivery or pickup, then pay via GCash or cash on delivery/pickup.',
    },
    {
        title: 'Track your order',
        description:
            'Follow your order status from confirmation to delivery, and leave a review once it’s complete.',
    },
];

const sellingSteps = [
    {
        title: 'Register your business',
        description: 'Sign up as a seller and provide your store details.',
    },
    {
        title: 'Get approved',
        description:
            'Our team reviews new seller registrations before your store goes live.',
    },
    {
        title: 'List your products',
        description:
            'Add your water products, prices, and keep stock availability up to date.',
    },
    {
        title: 'Manage orders',
        description:
            'Confirm incoming orders, mark payments received, and move orders through to delivery.',
    },
];

function StepList({
    steps,
}: {
    steps: { title: string; description: string }[];
}) {
    return (
        <ol className="space-y-6">
            {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                    </span>
                    <div>
                        <p className="font-medium text-foreground">
                            {step.title}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

export default function HowToUse() {
    return (
        <>
            <Head title="How to Use">
                <meta
                    name="description"
                    content="Learn how to order water or list your water supply business on Sakada PH."
                />
            </Head>

            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    How to use Sakada PH
                </h1>
                <p className="mb-12 text-base leading-relaxed text-muted-foreground">
                    Whether you're looking to order water or sell it, here's how
                    to get started.
                </p>

                <div className="space-y-14">
                    <section>
                        <h2 className="mb-6 text-xl font-semibold text-foreground">
                            Ordering water
                        </h2>
                        <StepList steps={orderingSteps} />
                        <Link
                            href={storesIndex()}
                            className="mt-8 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                        >
                            Find suppliers near me
                        </Link>
                    </section>

                    <section>
                        <h2 className="mb-6 text-xl font-semibold text-foreground">
                            Selling water
                        </h2>
                        <StepList steps={sellingSteps} />
                        <Link
                            href={sellerRegister()}
                            className="mt-8 inline-block rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                            List your business
                        </Link>
                    </section>
                </div>
            </div>
        </>
    );
}
