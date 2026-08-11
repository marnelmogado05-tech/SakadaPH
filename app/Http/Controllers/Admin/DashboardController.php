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
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $staleThreshold = Carbon::now()->subDays(7);

        $stats = [
            'pending_approvals' => Store::where('status', SellerStatus::Pending)->count(),
            'approved_sellers' => Store::where('status', SellerStatus::Approved)->count(),
            'total_consumers' => User::where('role', UserRole::User)->count(),
            'stale_stores' => Store::where('status', SellerStatus::Approved)
                ->where(function ($q) use ($staleThreshold) {
                    $q->doesntHave('products')
                        ->orWhereDoesntHave('products', fn ($q) => $q->where('last_updated_at', '>=', $staleThreshold));
                })
                ->count(),
            'in_stock_stores' => Store::where('status', SellerStatus::Approved)
                ->whereHas('products', fn ($q) => $q->whereNot('availability', ProductAvailability::OutOfStock))
                ->count(),
        ];

        $orderStats = [
            'total_orders' => Order::count(),
            'completed_orders' => Order::where('status', OrderStatus::Completed)->count(),
            'gmv' => (float) Order::where('payment_status', PaymentStatus::Paid)->sum('total'),
            'cash_orders' => Order::where('payment_method', PaymentMethod::Cash)->count(),
            'online_orders' => Order::whereIn('payment_method', [PaymentMethod::GCash, PaymentMethod::Card])->count(),
        ];

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'orderStats' => $orderStats,
        ]);
    }
}
