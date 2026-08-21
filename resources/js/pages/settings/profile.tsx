import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    action={ProfileController.update.url()}
                    method="patch"
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">First Name</Label>

                                <Input
                                    id="first_name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.first_name}
                                    name="first_name"
                                    required
                                    autoComplete="first_name"
                                    placeholder="First name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.first_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Middle Name</Label>

                                <Input
                                    id="middle_name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.middle_name}
                                    name="middle_name"
                                    required
                                    autoComplete="middle_name"
                                    placeholder="Middle name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.middle_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Last Name</Label>

                                <Input
                                    id="last_name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.last_name}
                                    name="last_name"
                                    required
                                    autoComplete="last_name"
                                    placeholder="Last name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.last_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Extension Name</Label>

                                <Input
                                    id="extension_name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.extension_name}
                                    name="extension_name"
                                    required
                                    autoComplete="extension_name"
                                    placeholder="Extension name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.extension_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-success">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="grid gap-2">
                                <Label htmlFor="contact_number">
                                    Contact number
                                </Label>

                                <Input
                                    id="contact_number"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.contact_number}
                                    name="contact_number"
                                    required
                                    autoComplete="contact_number"
                                    placeholder="Contact number"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
