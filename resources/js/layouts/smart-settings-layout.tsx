import { usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLayout from '@/layouts/app-layout';
import ConsumerLayout from '@/layouts/consumer-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function SmartSettingsLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props;

    if (auth.user?.role === 'user') {
        return (
            <ConsumerLayout>
                <SettingsLayout>{children}</SettingsLayout>
            </ConsumerLayout>
        );
    }

    return (
        <AppLayout>
            <SettingsLayout>{children}</SettingsLayout>
        </AppLayout>
    );
}
