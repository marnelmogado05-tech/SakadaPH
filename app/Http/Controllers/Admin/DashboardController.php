<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductAvailability;
use App\Enums\SellerStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
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

        return Inertia::render('admin/dashboard', ['stats' => $stats]);
    }
}
