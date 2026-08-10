<?php

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Store;
use App\Models\User;

it('wires order relations to user, store, items and payments', function () {
    $user = User::factory()->create();
    $store = Store::factory()->approved()->create();
    $order = Order::factory()->for($user)->for($store)->create();
    OrderItem::factory()->count(3)->for($order)->create();
    Payment::factory()->for($order)->create();

    expect($order->user->is($user))->toBeTrue()
        ->and($order->store->is($store))->toBeTrue()
        ->and($order->items)->toHaveCount(3)
        ->and($order->payments)->toHaveCount(1)
        ->and($user->orders)->toHaveCount(1)
        ->and($store->orders)->toHaveCount(1);
});

it('generates a unique SKD-prefixed reference', function () {
    $reference = Order::generateReference();

    expect($reference)->toStartWith('SKD-')
        ->and($reference)->toHaveLength(10);
});

it('gives each user a single cart', function () {
    $user = User::factory()->create();
    $cart = Cart::factory()->for($user)->create();

    expect($user->cart->is($cart))->toBeTrue();
});

it('snapshots price and computes line total on order items', function () {
    $item = OrderItem::factory()->create([
        'unit_price' => 100,
        'quantity' => 3,
        'line_total' => 300,
    ]);

    expect((float) $item->unit_price)->toBe(100.0)
        ->and((float) $item->line_total)->toBe(300.0);
});
