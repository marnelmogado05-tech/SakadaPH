<?php

namespace App\Http\Controllers\Seller;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductAvailability;
use App\Http\Controllers\Controller;
use App\Models\Product;
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
            // What is waiting on the seller right now.
            'attention' => [
                'pending_orders' => $store->orders()->where('status', OrderStatus::Pending)->count(),
                'out_of_stock' => $store->out_of_stock_count,
            ],
            'orderStats' => [
                'pending' => $store->orders()->where('status', OrderStatus::Pending)->count(),
                'today' => $store->orders()->whereDate('created_at', today())->count(),
                'revenue' => (float) $store->orders()->where('payment_status', PaymentStatus::Paid)->sum('total'),
            ],
            // Measured at ~9ms for all of these together, scoped to one store —
            // deferring would trade that for a full extra round trip.
            'rating' => $this->rating($store),
            'recent_products' => $this->recentProducts($store),
        ]);
    }

    /**
     * @return array{average: float|null, count: int}
     */
    private function rating(Store $store): array
    {
        $count = $store->reviews()->count();

        return [
            'average' => $count > 0 ? round((float) $store->reviews()->avg('rating'), 1) : null,
            'count' => $count,
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, availability: string, price: float, unit: string, last_updated_at: string|null}>
     */
    private function recentProducts(Store $store): array
    {
        return $store->products()
            ->orderByDesc('last_updated_at')
            ->limit(5)
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'availability' => $product->availability->value,
                'price' => (float) $product->price,
                'unit' => $product->unit,
                'last_updated_at' => $product->last_updated_at?->diffForHumans(),
            ])
            ->all();
    }
}
