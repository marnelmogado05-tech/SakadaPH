<?php

use App\Enums\FulfillmentType;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Store;
use App\Services\OrderPricingService;

beforeEach(function () {
    $this->pricing = new OrderPricingService;
});

function cartWithItems(Store $store, array $priceQtyPairs): Cart
{
    $cart = Cart::factory()->create(['store_id' => $store->id]);

    foreach ($priceQtyPairs as [$price, $qty]) {
        $product = Product::factory()->for($store)->create(['price' => $price]);
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => $qty,
        ]);
    }

    return $cart->load('items.product', 'store');
}

it('sums the subtotal from live product prices', function () {
    $store = Store::factory()->approved()->create();
    $cart = cartWithItems($store, [[100, 2], [50, 1]]);

    expect($this->pricing->subtotal($cart))->toBe(250.0);
});

it('charges the store flat delivery fee only for delivery', function () {
    $store = Store::factory()->approved()->create(['delivery_fee' => 50]);
    $cart = cartWithItems($store, [[100, 2]]);

    expect($this->pricing->deliveryFee($store, FulfillmentType::Delivery))->toBe(50.0)
        ->and($this->pricing->deliveryFee($store, FulfillmentType::Pickup))->toBe(0.0);
});

it('builds the full price breakdown for delivery and pickup', function () {
    $store = Store::factory()->approved()->create(['delivery_fee' => 50]);
    $cart = cartWithItems($store, [[100, 2], [50, 1]]);

    expect($this->pricing->priceCart($cart, FulfillmentType::Delivery))->toBe([
        'subtotal' => 250.0,
        'delivery_fee' => 50.0,
        'total' => 300.0,
    ]);

    expect($this->pricing->priceCart($cart, FulfillmentType::Pickup))->toBe([
        'subtotal' => 250.0,
        'delivery_fee' => 0.0,
        'total' => 250.0,
    ]);
});

it('enforces the store minimum order amount when set', function () {
    $store = Store::factory()->approved()->create(['min_order_amount' => 200]);

    expect($this->pricing->meetsMinimumOrder($store, 250.0))->toBeTrue()
        ->and($this->pricing->meetsMinimumOrder($store, 150.0))->toBeFalse();
});

it('treats a null minimum order amount as always met', function () {
    $store = Store::factory()->approved()->create(['min_order_amount' => null]);

    expect($this->pricing->meetsMinimumOrder($store, 1.0))->toBeTrue();
});
