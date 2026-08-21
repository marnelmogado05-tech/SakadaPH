<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\ProductAvailability;
use App\Enums\SellerStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * How long an approved store may go without touching its stock before the
     * listing is treated as unreliable.
     */
    private const STALE_AFTER_DAYS = 7;

    public function index(): Response
    {
        return Inertia::render('admin/dashboard', [
            // What is waiting on a person. Loads with the page — it is the
            // reason to open this screen at all.
            'attention' => $this->attention(),

            'stats' => [
                'pending_approvals' => Store::where('status', SellerStatus::Pending)->count(),
                'approved_sellers' => Store::where('status', SellerStatus::Approved)->count(),
                'total_consumers' => User::where('role', UserRole::User)->count(),
                'stale_stores' => $this->staleStoresQuery()->count(),
                'in_stock_stores' => Store::where('status', SellerStatus::Approved)
                    ->whereHas('products', fn ($q) => $q->whereNot('availability', ProductAvailability::OutOfStock))
                    ->count(),
            ],

            // Platform totals sit below the fold and scan the whole orders
            // table, so they stream in rather than holding up first paint.
            'orderStats' => Inertia::defer(fn () => [
                'total_orders' => Order::count(),
                'completed_orders' => Order::where('status', OrderStatus::Completed)->count(),
                'gmv' => (float) Order::where('payment_status', PaymentStatus::Paid)->sum('total'),
                'cash_orders' => Order::where('payment_method', PaymentMethod::Cash)->count(),
                'online_orders' => Order::whereIn('payment_method', [PaymentMethod::GCash, PaymentMethod::Card])->count(),
            ]),
        ]);
    }

    /**
     * The two things an admin can actually act on, with enough detail to act.
     *
     * @return array{pending_approvals: int, stale_count: int, stale_stores: array<int, array{id: int, name: string, address: string}>}
     */
    private function attention(): array
    {
        $stale = $this->staleStoresQuery()
            ->orderBy('name')
            ->limit(5)
            ->get(['id', 'name', 'address']);

        return [
            'pending_approvals' => Store::where('status', SellerStatus::Pending)->count(),
            'stale_count' => $this->staleStoresQuery()->count(),
            'stale_stores' => $stale->map(fn (Store $store) => [
                'id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
            ])->all(),
        ];
    }

    /**
     * Approved stores that have listed nothing, or whose stock has not been
     * touched inside the staleness window.
     *
     * @return Builder<Store>
     */
    private function staleStoresQuery(): Builder
    {
        $threshold = Carbon::now()->subDays(self::STALE_AFTER_DAYS);

        return Store::where('status', SellerStatus::Approved)
            ->where(function ($q) use ($threshold) {
                $q->doesntHave('products')
                    ->orWhereDoesntHave('products', fn ($q) => $q->where('last_updated_at', '>=', $threshold));
            });
    }
}
