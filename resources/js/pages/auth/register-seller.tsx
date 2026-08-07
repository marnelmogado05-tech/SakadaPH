import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/seller/register';

type Props = {
    passwordRules: string;
};

export default function RegisterSeller({ passwordRules }: Props) {
    const [extensionName, setExtensionName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [storeContactNumber, setStoreContactNumber] = useState('');

    return (
        <>
            <Head title="Register as a Seller" />

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Account details */}
                        <div className="grid gap-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Account details
                            </p>

                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    required
                                    autoFocus
                                    autoComplete="given-name"
                                    placeholder="e.g. Juan"
                                />
                                <InputError message={errors.first_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="middle_name">Middle Name</Label>
                                <Input
                                    id="middle_name"
                                    name="middle_name"
                                    type="text"
                                    autoComplete="additional-name"
                                    placeholder="e.g. Gomez"
                                />
                                <InputError message={errors.middle_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    required
                                    autoComplete="family-name"
                                    placeholder="e.g. Dela Cruz"
                                />
                                <InputError message={errors.last_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="extension_name">Extension Name</Label>
                                <Select
                                    value={extensionName}
                                    onValueChange={setExtensionName}
                                    name="extension_name"
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="None (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Jr.">Jr.</SelectItem>
                                        <SelectItem value="Sr.">Sr.</SelectItem>
                                        <SelectItem value="II">II</SelectItem>
                                        <SelectItem value="III">III</SelectItem>
                                        <SelectItem value="IV">IV</SelectItem>
                                        <SelectItem value="V">V</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.extension_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="contact_number">Contact number</Label>
                                <Input
                                    id="contact_number"
                                    name="contact_number"
                                    type="tel"
                                    required
                                    autoComplete="tel"
                                    placeholder="e.g. 09123456789"
                                    maxLength={11}
                                    inputMode="numeric"
                                    value={contactNumber}
                                    onChange={(e) =>
                                        setContactNumber(e.target.value.replace(/\D/g, ''))
                                    }
                                />
                                <InputError message={errors.contact_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="new-password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>

                        {/* Store details */}
                        <div className="grid gap-4 border-t border-border pt-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Store details
                            </p>

                            <div className="grid gap-2">
                                <Label htmlFor="store_name">Store / Business name</Label>
                                <Input
                                    id="store_name"
                                    name="store_name"
                                    type="text"
                                    required
                                    placeholder="e.g. Juan's Water Station"
                                />
                                <InputError message={errors.store_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="store_address">Address</Label>
                                <Input
                                    id="store_address"
                                    name="store_address"
                                    type="text"
                                    required
                                    placeholder="Full address of your store"
                                />
                                <InputError message={errors.store_address} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="store_description">
                                    Description{' '}
                                    <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <Input
                                    id="store_description"
                                    name="store_description"
                                    type="text"
                                    placeholder="Brief description of your water business"
                                />
                                <InputError message={errors.store_description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="store_contact_number">
                                    Store contact number{' '}
                                    <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <Input
                                    id="store_contact_number"
                                    name="store_contact_number"
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder="e.g. 09123456789"
                                    maxLength={11}
                                    inputMode="numeric"
                                    value={storeContactNumber}
                                    onChange={(e) =>
                                        setStoreContactNumber(e.target.value.replace(/\D/g, ''))
                                    }
                                />
                                <InputError message={errors.store_contact_number} />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                            data-test="register-seller-button"
                        >
                            {processing && <Spinner />}
                            Submit application
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()}>Log in</TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

RegisterSeller.layout = {
    title: 'List your water business',
    description: 'Create your seller account to get started on Sakada.ph',
};
