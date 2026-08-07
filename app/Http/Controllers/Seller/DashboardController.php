<?php

namespace App\Http\Controllers\Seller;

use App\Enums\ProductAvailability;
use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;
        $store->loadCount([
            'products',
            'products as in_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::InStock),
            'products as low_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::LowStock),
            'products as out_of_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::OutOfStock),
            'followers',
        ]);

        $recentProducts = $store->products()
            ->orderByDesc('last_updated_at')
            ->limit(5)
            ->get()
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'availability' => $product->availability->value,
                'price' => (float) $product->price,
                'unit' => $product->unit,
                'last_updated_at' => $product->last_updated_at?->diffForHumans(),
            ]);

        return Inertia::render('seller/dashboard', [
            'store' => [
                'name' => $store->name,
                'status' => $store->status->value,
                'type' => $store->type?->value,
                'followers_count' => $store->followers_count,
            ],
            'stats' => [
                'total_products' => $store->products_count,
                'in_stock' => $store->in_stock_count,
                'low_stock' => $store->low_stock_count,
                'out_of_stock' => $store->out_of_stock_count,
            ],
            'recent_products' => $recentProducts,
        ]);
    }
}
