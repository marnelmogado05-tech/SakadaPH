import { usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import ConsumerLayout from '@/layouts/consumer-layout';
import SellerLayout from '@/layouts/seller-layout';
import type { AppLayoutProps } from '@/types';

/**
 * The notifications page is shared by every role, so render it inside whichever
 * chrome matches the signed-in user.
 */
export default function SmartNotificationsLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage().props;
    const role = auth.user?.role;

    if (role === 'seller') {
        return <SellerLayout breadcrumbs={breadcrumbs}>{children}</SellerLayout>;
    }

    if (role === 'admin') {
        return <AdminLayout breadcrumbs={breadcrumbs}>{children}</AdminLayout>;
    }

    return <ConsumerLayout>{children}</ConsumerLayout>;
}
