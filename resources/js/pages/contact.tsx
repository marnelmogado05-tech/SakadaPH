import { Head } from '@inertiajs/react';
import { Mail, MapPin } from 'lucide-react';

export default function Contact() {
    return (
        <>
            <Head title="Contact">
                <meta
                    name="description"
                    content="Get in touch with the Sakada PH team."
                />
            </Head>

            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Contact us
                </h1>
                <p className="mb-12 text-base leading-relaxed text-muted-foreground">
                    Questions, feedback, or issues with an order? Reach out
                    and we'll get back to you.
                </p>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Mail className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Email
                            </p>
                            <a
                                href="mailto:support@sakada.ph"
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                support@sakada.ph
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <MapPin className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Based in
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Philippines
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
