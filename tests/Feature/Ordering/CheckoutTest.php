<?php

use App\Enums\FulfillmentType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductAvailability;
use App\Enums\StoreType;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;

/**
 * Build a consumer with a populated single-store cart.
 *
 * @return array{0: User, 1: Store, 2: Product}
 */
function consumerWithCart(array $storeAttributes = [], float $price = 100, int $quantity = 2): array
{
    $user = User::factory()->create(['contact_number' => '09171234567']);
    $store = Store::factory()->approved()->create(array_merge(['type' => StoreType::Both], $storeAttributes));
    $product = Product::factory()->for($store)->create(['price' => $price]);
    $cart = Cart::factory()->for($user)->create(['store_id' => $store->id]);
    CartItem::factory()->for($cart)->create(['product_id' => $product->id, 'quantity' => $quantity]);

    return [$user, $store, $product];
}

it('redirects to the cart when checking out with an empty cart', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('checkout.show'))->assertRedirect(route('cart.index'));
});

it('places a pickup cash order and clears the cart', function () {
    [$user, $store, $product] = consumerWithCart();

    $this->actingAs($user)
        ->post(route('orders.store'), [
            'fulfillment_type' => FulfillmentType::Pickup->value,
            'payment_method' => 'cash',
            'contact_number' => '09171234567',
        ])
        ->assertRedirect();

    $order = Order::first();
    expect($order)->not->toBeNull()
        ->and($order->status)->toBe(OrderStatus::Pending)
        ->and($order->payment_status)->toBe(PaymentStatus::Unpaid)
        ->and((float) $order->subtotal)->toBe(200.0)
        ->and((float) $order->delivery_fee)->toBe(0.0)
        ->and((float) $order->total)->toBe(200.0)
        ->and($order->items)->toHaveCount(1)
        ->and($user->cart->fresh()->items)->toHaveCount(0);
});

it('snapshots the product price at order time', function () {
    [$user, $store, $product] = consumerWithCart(price: 100);

    $this->actingAs($user)->post(route('orders.store'), [
        'fulfillment_type' => FulfillmentType::Pickup->value,
        'payment_method' => 'cash',
        'contact_number' => '09171234567',
    ]);

    $product->update(['price' => 999]);

    expect((float) Order::first()->items->first()->unit_price)->toBe(100.0);
});

it('adds the flat delivery fee for delivery orders', function () {
    [$user, $store, $product] = consumerWithCart(['delivery_fee' => 50, 'latitude' => 14.5995, 'longitude' => 120.9842, 'service_radius_km' => 10]);

    $this->actingAs($user)->post(route('orders.store'), [
        'fulfillment_type' => FulfillmentType::Delivery->value,
        'payment_method' => 'cash',
        'contact_number' => '09171234567',
        'delivery_address' => '123 Test St',
        'delivery_latitude' => 14.6,
        'delivery_longitude' => 120.985,
    ])->assertRedirect();

    $order = Order::first();
    expect((float) $order->delivery_fee)->toBe(50.0)
        ->and((float) $order->total)->toBe(250.0);
});

it('rejects delivery outside the store service radius', function () {
    [$user, $store, $product] = consumerWithCart(['delivery_fee' => 50, 'latitude' => 14.5995, 'longitude' => 120.9842, 'service_radius_km' => 5]);

    $this->actingAs($user)
        ->from(route('checkout.show'))
        ->post(route('orders.store'), [
            'fulfillment_type' => FulfillmentType::Delivery->value,
            'payment_method' => 'cash',
            'contact_number' => '09171234567',
            'delivery_address' => 'Far away',
            'delivery_latitude' => 15.5,
            'delivery_longitude' => 121.9,
        ])
        ->assertSessionHasErrors('delivery_latitude');

    expect(Order::count())->toBe(0);
});

it('enforces the store minimum order amount', function () {
    [$user] = consumerWithCart(['min_order_amount' => 500], price: 100, quantity: 2);

    $this->actingAs($user)
        ->from(route('checkout.show'))
        ->post(route('orders.store'), [
            'fulfillment_type' => FulfillmentType::Pickup->value,
            'payment_method' => 'cash',
            'contact_number' => '09171234567',
        ])
        ->assertSessionHasErrors('cart');

    expect(Order::count())->toBe(0);
});

it('rejects a fulfillment type the store does not offer', function () {
    [$user] = consumerWithCart(['type' => StoreType::Pickup]);

    $this->actingAs($user)
        ->from(route('checkout.show'))
        ->post(route('orders.store'), [
            'fulfillment_type' => FulfillmentType::Delivery->value,
            'payment_method' => 'cash',
            'contact_number' => '09171234567',
            'delivery_address' => '123 St',
            'delivery_latitude' => 14.6,
            'delivery_longitude' => 120.9,
        ])
        ->assertSessionHasErrors('fulfillment_type');
});

it('blocks checkout when a cart item is out of stock', function () {
    [$user, $store, $product] = consumerWithCart();
    $product->setAvailability(ProductAvailability::OutOfStock);

    $this->actingAs($user)
        ->from(route('checkout.show'))
        ->post(route('orders.store'), [
            'fulfillment_type' => FulfillmentType::Pickup->value,
            'payment_method' => 'cash',
            'contact_number' => '09171234567',
        ])
        ->assertSessionHasErrors('cart');

    expect(Order::count())->toBe(0);
});

it('rejects online payment methods in this slice', function () {
    [$user] = consumerWithCart();

    $this->actingAs($user)
        ->from(route('checkout.show'))
        ->post(route('orders.store'), [
            'fulfillment_type' => FulfillmentType::Pickup->value,
            'payment_method' => 'gcash',
            'contact_number' => '09171234567',
        ])
        ->assertSessionHasErrors('payment_method');
});
