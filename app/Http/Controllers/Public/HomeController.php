<?php

namespace App\Http\Controllers\Public;

use App\Enums\ProductAvailability;
use App\Enums\SellerStatus;
use App\Http\Controllers\Controller;
use App\Models\Store;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * The landing page leads with real suppliers and their current stock
     * rather than a claim about them.
     */
    public function __invoke(): Response
    {
        return Inertia::render('welcome', [
            'recentlyUpdated' => $this->recentlyUpdatedStores(),
            'supplierCount' => Store::where('status', SellerStatus::Approved)->count(),
        ]);
    }

    /**
     * Approved stores that have listed products, freshest stock update first.
     *
     * @return array<int, array{id: int, name: string, address: string, type: string|null, store_availability: string, price_min: float|null, price_max: float|null, last_updated_at: string|null}>
     */
    private function recentlyUpdatedStores(): array
    {
        return Store::where('status', SellerStatus::Approved)
            ->whereHas('products')
            ->withCount([
                'products',
                'products as in_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::InStock),
                'products as low_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::LowStock),
            ])
            ->withMin('products', 'price')
            ->withMax('products', 'price')
            ->withMax('products', 'last_updated_at')
            ->orderByDesc('products_max_last_updated_at')
            ->limit(3)
            ->get()
            ->map(fn (Store $store) => [
                'id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'type' => $store->type?->value,
                'store_availability' => $store->stockState(),
                'price_min' => $store->products_min_price !== null ? (float) $store->products_min_price : null,
                'price_max' => $store->products_max_price !== null ? (float) $store->products_max_price : null,
                'last_updated_at' => $store->products_max_last_updated_at,
            ])
            ->all();
    }
}
