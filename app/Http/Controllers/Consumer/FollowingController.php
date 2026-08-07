<?php

namespace App\Http\Controllers\Consumer;

use App\Enums\ProductAvailability;
use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FollowingController extends Controller
{
    public function index(Request $request): Response
    {
        $stores = $request->user()
            ->followedStores()
            ->withCount([
                'products',
                'products as in_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::InStock),
                'products as low_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::LowStock),
            ])
            ->withMax('products', 'last_updated_at')
            ->orderBy('name')
            ->get()
            ->map(fn (Store $store) => [
                'id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'type' => $store->type?->value,
                'store_availability' => $this->storeAvailability($store),
                'last_updated_at' => $store->products_max_last_updated_at,
            ]);

        return Inertia::render('stores/following', ['stores' => $stores]);
    }

    private function storeAvailability(Store $store): string
    {
        if ($store->products_count === 0) {
            return 'no_products';
        }
        if ($store->in_stock_count > 0) {
            return 'in_stock';
        }
        if ($store->low_stock_count > 0) {
            return 'low_stock';
        }

        return 'out_of_stock';
    }
}
