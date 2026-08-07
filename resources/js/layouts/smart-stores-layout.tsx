import { usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import ConsumerLayout from '@/layouts/consumer-layout';
import PublicLayout from '@/layouts/public-layout';

export default function SmartStoresLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props;

    if (auth.user?.role === 'user') {
        return <ConsumerLayout>{children}</ConsumerLayout>;
    }

    return <PublicLayout>{children}</PublicLayout>;
}
