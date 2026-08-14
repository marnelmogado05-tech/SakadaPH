import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AdminLayout from '@/layouts/admin-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import ConsumerLayout from '@/layouts/consumer-layout';
import PublicLayout from '@/layouts/public-layout';
import SellerLayout from '@/layouts/seller-layout';
import SmartNotificationsLayout from '@/layouts/smart-notifications-layout';
import SmartSettingsLayout from '@/layouts/smart-settings-layout';
import SmartStoresLayout from '@/layouts/smart-stores-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'banned':
            case name === 'seller/pending':
            case name === 'seller/suspended':
                return null;
            case name === 'welcome':
            case name === 'about':
            case name === 'contact':
            case name === 'how-to-use':
            case name === 'terms':
            case name === 'privacy':
                return PublicLayout;
            case name === 'notifications':
                return SmartNotificationsLayout;
            case name === 'dashboard':
            case name === 'stores/following':
            case name.startsWith('consumer/'):
                return ConsumerLayout;
            case name.startsWith('stores/'):
                return SmartStoresLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return SmartSettingsLayout;
            case name.startsWith('admin/'):
                return AdminLayout;
            case name.startsWith('seller/'):
                return SellerLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
