<?php

namespace App\Services;

use App\Enums\FulfillmentType;
use App\Models\Cart;
use App\Models\Store;

class OrderPricingService
{
    /**
     * Compute the authoritative price breakdown for a cart under a fulfillment type.
     *
     * Uses live product prices; snapshotting into order_items happens at order creation.
     *
     * @return array{subtotal: float, delivery_fee: float, total: float}
     */
    public function priceCart(Cart $cart, FulfillmentType $fulfillmentType): array
    {
        /** @var Store $store */
        $store = $cart->store;

        $subtotal = $this->subtotal($cart);
        $deliveryFee = $this->deliveryFee($store, $fulfillmentType);

        return [
            'subtotal' => $subtotal,
            'delivery_fee' => $deliveryFee,
            'total' => round($subtotal + $deliveryFee, 2),
        ];
    }

    /**
     * Sum of every cart line using the product's current price.
     */
    public function subtotal(Cart $cart): float
    {
        $subtotal = $cart->items->sum(
            fn ($item) => (float) $item->product->price * $item->quantity
        );

        return round($subtotal, 2);
    }

    /**
     * Flat per-order delivery fee for the store; zero for pickup.
     */
    public function deliveryFee(Store $store, FulfillmentType $fulfillmentType): float
    {
        if ($fulfillmentType !== FulfillmentType::Delivery) {
            return 0.0;
        }

        return round((float) ($store->delivery_fee ?? 0), 2);
    }

    /**
     * Whether the subtotal satisfies the store's minimum order amount (if any).
     */
    public function meetsMinimumOrder(Store $store, float $subtotal): bool
    {
        if ($store->min_order_amount === null) {
            return true;
        }

        return $subtotal >= (float) $store->min_order_amount;
    }
}
