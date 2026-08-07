<?php

namespace App\Http\Controllers\Public;

use App\Enums\ProductAvailability;
use App\Enums\SellerStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(Request $request): Response
    {
        $lat = is_numeric($request->query('lat')) ? (float) $request->query('lat') : null;
        $lng = is_numeric($request->query('lng')) ? (float) $request->query('lng') : null;
        $search = $request->string('search')->toString() ?: null;
        $type = $request->string('type')->toString() ?: null;
        $inStockOnly = $request->boolean('in_stock_only');
        $maxDistance = is_numeric($request->query('max_distance')) ? (float) $request->query('max_distance') : null;

        $query = Store::where('status', SellerStatus::Approved)
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($inStockOnly, fn ($q) => $q->whereHas('products', fn ($q) => $q->whereNot('availability', ProductAvailability::OutOfStock)))
            ->withCount([
                'products',
                'products as in_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::InStock),
                'products as low_stock_count' => fn ($q) => $q->where('availability', ProductAvailability::LowStock),
            ])
            ->withMin('products', 'price')
            ->withMax('products', 'price')
            ->withMax('products', 'last_updated_at');

        $hasDistance = $lat !== null && $lng !== null && DB::getDriverName() === 'mysql';

        if ($hasDistance) {
            $latF = number_format($lat, 7, '.', '');
            $lngF = number_format($lng, 7, '.', '');
            $distExpr = "IF(latitude IS NOT NULL AND longitude IS NOT NULL, ST_Distance_Sphere(POINT(longitude, latitude), POINT({$lngF}, {$latF})) / 1000, NULL)";

            $query->addSelect(DB::raw("{$distExpr} AS distance_km"));

            if ($maxDistance) {
                $query->whereRaw("({$distExpr}) IS NOT NULL AND ({$distExpr}) <= {$maxDistance}");
            }

            $query->orderByRaw("({$distExpr}) IS NULL, ({$distExpr}) ASC");
        } else {
            $query->orderBy('stores.name');
        }

        $stores = $query->paginate(12)
            ->withQueryString()
            ->through(fn (Store $store) => [
                'id' => $store->id,
                'name' => $store->name,
                'description' => $store->description,
                'address' => $store->address,
                'type' => $store->type?->value,
                'products_count' => $store->products_count,
                'latitude' => $store->latitude !== null ? (float) $store->latitude : null,
                'longitude' => $store->longitude !== null ? (float) $store->longitude : null,
                'distance_km' => ($hasDistance && $store->distance_km !== null)
                    ? round((float) $store->distance_km, 1)
                    : null,
                'store_availability' => $this->storeAvailability($store),
                'price_min' => $store->products_min_price !== null ? (float) $store->products_min_price : null,
                'price_max' => $store->products_max_price !== null ? (float) $store->products_max_price : null,
                'last_updated_at' => $store->products_max_last_updated_at,
            ]);

        return Inertia::render('stores/index', [
            'stores' => $stores,
            'filters' => [
                'search' => $search ?? '',
                'type' => $type ?? '',
                'in_stock_only' => $inStockOnly,
                'max_distance' => $maxDistance,
                'lat' => $lat,
                'lng' => $lng,
            ],
        ]);
    }

    public function show(Request $request, Store $store): Response
    {
        abort_unless($store->isApproved(), 404);

        $user = $request->user();
        $isConsumer = $user?->role === UserRole::User;
        $isFollowed = $isConsumer && $store->followers()->where('user_id', $user->id)->exists();

        $products = $store->products()
            ->whereNot('availability', ProductAvailability::OutOfStock)
            ->orderBy('name')
            ->get()
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'unit' => $product->unit,
                'quantity' => $product->quantity,
                'availability' => $product->availability->value,
                'image_url' => $product->image_path
                    ? Storage::disk('public')->url($product->image_path)
                    : null,
            ]);

        return Inertia::render('stores/show', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'description' => $store->description,
                'address' => $store->address,
                'contact_number' => $store->contact_number,
                'type' => $store->type?->value,
                'is_followed' => $isFollowed,
                'can_follow' => $isConsumer,
            ],
            'products' => $products,
        ]);
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
