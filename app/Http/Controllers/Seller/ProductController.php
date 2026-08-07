<?php

namespace App\Http\Controllers\Seller;

use App\Enums\ProductAvailability;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\ProductStoreRequest;
use App\Jobs\SendStockAlert;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;
        $products = $store->products()
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'unit' => $product->unit,
                'quantity' => $product->quantity,
                'availability' => $product->availability->value,
                'image_url' => $product->image_path
                    ? Storage::disk('public')->url($product->image_path)
                    : null,
            ]);

        return Inertia::render('seller/products/index', [
            'products' => $products,
            'availabilityOptions' => collect(ProductAvailability::cases())->map(fn (ProductAvailability $a) => [
                'value' => $a->value,
                'label' => $a->label(),
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('seller/products/create', [
            'availabilityOptions' => collect(ProductAvailability::cases())->map(fn (ProductAvailability $a) => [
                'value' => $a->value,
                'label' => $a->label(),
            ]),
        ]);
    }

    public function store(ProductStoreRequest $request): RedirectResponse
    {
        $validated = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('products', 'public');
        }

        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;
        $store->products()->create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product added.']);

        return to_route('seller.products.index');
    }

    public function edit(Request $request, Product $product): Response
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;
        abort_unless($product->store_id === $store->id, 403);

        return Inertia::render('seller/products/edit', [
            'product' => [
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
            ],
            'availabilityOptions' => collect(ProductAvailability::cases())->map(fn (ProductAvailability $a) => [
                'value' => $a->value,
                'label' => $a->label(),
            ]),
        ]);
    }

    public function update(ProductStoreRequest $request, Product $product): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;
        abort_unless($product->store_id === $store->id, 403);

        $validated = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }

            $validated['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product updated.']);

        return to_route('seller.products.index');
    }

    public function updateAvailability(Request $request, Product $product): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;
        abort_unless($product->store_id === $store->id, 403);

        $validated = $request->validate([
            'availability' => ['required', new Enum(ProductAvailability::class)],
        ]);

        $previousAvailability = $product->availability;
        $newAvailability = ProductAvailability::from($validated['availability']);

        $product->setAvailability($newAvailability);

        if ($previousAvailability !== ProductAvailability::InStock && $newAvailability === ProductAvailability::InStock) {
            SendStockAlert::dispatch($product);
        }

        return back();
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;
        abort_unless($product->store_id === $store->id, 403);

        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product removed.']);

        return to_route('seller.products.index');
    }
}
