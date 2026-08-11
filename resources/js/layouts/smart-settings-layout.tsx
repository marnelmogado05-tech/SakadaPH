import { usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import ConsumerLayout from '@/layouts/consumer-layout';
import SellerLayout from '@/layouts/seller-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { AppLayoutProps } from '@/types';

export default function SmartSettingsLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage().props;
    const role = auth.user?.role;

    if (role === 'user') {
        return (
            <ConsumerLayout>
                <SettingsLayout centered>{children}</SettingsLayout>
            </ConsumerLayout>
        );
    }

    if (role === 'seller') {
        return (
            <SellerLayout breadcrumbs={breadcrumbs}>
                <SettingsLayout>{children}</SettingsLayout>
            </SellerLayout>
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <SettingsLayout>{children}</SettingsLayout>
        </AdminLayout>
    );
}
