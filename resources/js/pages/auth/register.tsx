import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import GoogleIcon from '@/components/google-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { login } from '@/routes';
import { redirect as socialiteRedirect } from '@/routes/auth';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [extensionName, setExtensionName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const isMobile = useIsMobile();

    return (
        <>
            <Head title="Register" />
            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    required
                                    autoFocus={!isMobile}
                                    tabIndex={1}
                                    autoComplete="first_name"
                                    name="first_name"
                                    placeholder="e.g. Juan"
                                />
                                <InputError
                                    message={errors.first_name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="middle_name">Middle Name</Label>
                                <Input
                                    id="middle_name"
                                    type="text"
                                    tabIndex={1}
                                    autoComplete="middle_name"
                                    name="middle_name"
                                    placeholder="e.g. Gomez"
                                />
                                <InputError
                                    message={errors.middle_name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    required
                                    tabIndex={1}
                                    autoComplete="last_name"
                                    name="last_name"
                                    placeholder="e.g. Dela Cruz"
                                />
                                <InputError
                                    message={errors.last_name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grip gap-2">
                                <Label htmlFor="extension_name">
                                    Extension Name
                                </Label>

                                <Select
                                    value={extensionName}
                                    onValueChange={setExtensionName}
                                    name="extension_name"
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="e.g. Jr., Sr." />
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
                                <span className="text-sm text-muted-foreground">
                                    Optional
                                </span>

                                <InputError
                                    message={errors.extension_name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="contact_number">
                                    Contact number
                                </Label>
                                <Input
                                    id="contact_number"
                                    type="tel"
                                    required
                                    tabIndex={2}
                                    autoComplete="tel"
                                    name="contact_number"
                                    placeholder="e.g. 09123456789"
                                    maxLength={11}
                                    inputMode="numeric"
                                    value={contactNumber}
                                    onChange={(e) => {
                                        const numbersOnly =
                                            e.target.value.replace(/\D/g, '');
                                        setContactNumber(numbersOnly);
                                    }}
                                />
                                <InputError message={errors.contact_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            <div className="flex items-center gap-3 py-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                    Or continue with
                </span>
                <Separator className="flex-1" />
            </div>

            <Button variant="outline" className="w-full" asChild>
                <a href={socialiteRedirect.url('google')}>
                    <GoogleIcon className="size-4" />
                    Continue with Google
                </a>
            </Button>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
