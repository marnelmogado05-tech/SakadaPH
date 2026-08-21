import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import {
    SellerMobileHeader,
    SellerMobileNav,
} from '@/components/seller-mobile-nav';
import { SellerSidebar } from '@/components/seller-sidebar';
import type { AppLayoutProps } from '@/types';

export default function SellerLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <SellerSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                {/* Sidebar and breadcrumbs from lg up; bottom navigation below,
                    where a seller is working one-handed. */}
                <div className="hidden lg:block">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                </div>
                <SellerMobileHeader />

                {/* Room for the fixed bottom bar. */}
                <div className="pb-24 lg:pb-0">{children}</div>

                <SellerMobileNav />
            </AppContent>
        </AppShell>
    );
}
