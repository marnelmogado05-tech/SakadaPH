<?php

namespace App\Http\Controllers\Consumer;

use App\Enums\ProductAvailability;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderPricingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(Request $request, OrderPricingService $pricing): Response
    {
        /** @var User $user */
        $user = $request->user();
        $cart = $this->cartFor($user)->load('items.product', 'store');

        $items = $cart->items
            ->filter(fn (CartItem $item) => $item->product !== null)
            ->map(fn (CartItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->product->name,
                'unit' => $item->product->unit,
                'price' => (float) $item->product->price,
                'quantity' => $item->quantity,
                'line_total' => round((float) $item->product->price * $item->quantity, 2),
                'availability' => $item->product->availability->value,
                'image_url' => $item->product->image_path
                    ? Storage::disk('public')->url($item->product->image_path)
                    : null,
            ])
            ->values();

        return Inertia::render('consumer/cart/index', [
            'store' => $cart->store ? [
                'id' => $cart->store->id,
                'name' => $cart->store->name,
                'type' => $cart->store->type?->value,
                'min_order_amount' => $cart->store->min_order_amount !== null
                    ? (float) $cart->store->min_order_amount
                    : null,
                'delivery_fee' => $cart->store->delivery_fee !== null
                    ? (float) $cart->store->delivery_fee
                    : null,
            ] : null,
            'items' => $items,
            'subtotal' => $pricing->subtotal($cart),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:999'],
            'force' => ['nullable', 'boolean'],
        ]);

        /** @var User $user */
        $user = $request->user();
        /** @var Product $product */
        $product = Product::with('store')->findOrFail($validated['product_id']);

        if (! $product->store->isApproved()) {
            throw ValidationException::withMessages([
                'product_id' => 'This store is not currently accepting orders.',
            ]);
        }

        if ($product->availability === ProductAvailability::OutOfStock) {
            throw ValidationException::withMessages([
                'product_id' => 'This product is out of stock.',
            ]);
        }

        $cart = $this->cartFor($user);
        $switchingStore = $cart->store_id !== null
            && $cart->store_id !== $product->store_id
            && $cart->items()->exists();

        if ($switchingStore && ! $request->boolean('force')) {
            throw ValidationException::withMessages([
                'store_conflict' => 'Your cart contains items from another store. Clear it to add this product.',
            ]);
        }

        if ($switchingStore) {
            $cart->items()->delete();
        }

        $cart->update(['store_id' => $product->store_id]);

        $quantity = $validated['quantity'] ?? 1;
        $item = $cart->items()->firstOrNew(['product_id' => $product->id]);
        $item->quantity = ($item->exists ? $item->quantity : 0) + $quantity;
        $item->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Added to cart.']);

        return back();
    }

    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        $this->authorizeItem($request, $cartItem);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $cartItem->update(['quantity' => $validated['quantity']]);

        return back();
    }

    public function destroy(Request $request, CartItem $cartItem): RedirectResponse
    {
        $cart = $this->authorizeItem($request, $cartItem);

        $cartItem->delete();

        if (! $cart->items()->exists()) {
            $cart->update(['store_id' => null]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Item removed.']);

        return back();
    }

    public function clear(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $cart = $this->cartFor($user);
        $cart->items()->delete();
        $cart->update(['store_id' => null]);

        return back();
    }

    private function cartFor(User $user): Cart
    {
        return Cart::firstOrCreate(['user_id' => $user->id]);
    }

    private function authorizeItem(Request $request, CartItem $cartItem): Cart
    {
        /** @var User $user */
        $user = $request->user();
        $cart = $this->cartFor($user);
        abort_unless($cartItem->cart_id === $cart->id, 403);

        return $cart;
    }
}
