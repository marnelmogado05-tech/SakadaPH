<?php

namespace App\Http\Middleware;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'notifications_count' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
                'cart_count' => fn () => (int) ($request->user()?->cart?->items()->sum('quantity') ?? 0),
                'seller_pending_orders_count' => fn () => $this->sellerPendingOrdersCount($request),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Pending order count for the authenticated seller's store (0 otherwise).
     */
    private function sellerPendingOrdersCount(Request $request): int
    {
        $user = $request->user();

        if ($user?->role !== UserRole::Seller) {
            return 0;
        }

        return (int) ($user->store?->orders()->where('status', OrderStatus::Pending)->count() ?? 0);
    }
}
