<?php

namespace App\Http\Controllers\Consumer;

use App\Enums\FulfillmentType;
use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Store;
use App\Models\User;
use App\Services\OrderPricingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function show(Request $request, OrderPricingService $pricing): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $cart = $user->cart?->load('items.product', 'store');

        if ($cart === null || $cart->items->isEmpty() || $cart->store === null) {
            return to_route('cart.index');
        }

        /** @var Store $store */
        $store = $cart->store;

        $items = $cart->items
            ->filter(fn (CartItem $item) => $item->product !== null)
            ->map(fn (CartItem $item) => [
                'id' => $item->id,
                'name' => $item->product->name,
                'unit' => $item->product->unit,
                'price' => (float) $item->product->price,
                'quantity' => $item->quantity,
                'line_total' => round((float) $item->product->price * $item->quantity, 2),
            ])
            ->values();

        return Inertia::render('consumer/checkout/index', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'type' => $store->type?->value,
                'latitude' => $store->latitude !== null ? (float) $store->latitude : null,
                'longitude' => $store->longitude !== null ? (float) $store->longitude : null,
                'service_radius_km' => $store->service_radius_km !== null ? (float) $store->service_radius_km : null,
                'delivery_fee' => $store->delivery_fee !== null ? (float) $store->delivery_fee : 0.0,
                'min_order_amount' => $store->min_order_amount !== null ? (float) $store->min_order_amount : null,
            ],
            'fulfillmentOptions' => collect(FulfillmentType::cases())
                ->filter(fn (FulfillmentType $type) => $type->isAllowedBy($store->type))
                ->map(fn (FulfillmentType $type) => [
                    'value' => $type->value,
                    'label' => $type->label(),
                ])
                ->values(),
            'items' => $items,
            'subtotal' => $pricing->subtotal($cart),
            'contactNumber' => $user->contact_number,
            'paymentMethods' => $this->paymentMethods($store),
        ]);
    }

    /**
     * Cash is always available; GCash only when the store has enabled it with a number.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function paymentMethods(Store $store): array
    {
        $methods = [['value' => 'cash', 'label' => 'Cash on handover']];

        if ($store->accepts_online_payment && $store->gcash_number !== null) {
            $methods[] = ['value' => 'gcash', 'label' => 'GCash'];
        }

        return $methods;
    }
}
