<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;

it('lists only the consumer own orders', function () {
    $user = User::factory()->create();
    Order::factory()->count(2)->for($user)->create();
    Order::factory()->create();

    $this->actingAs($user)
        ->get(route('orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consumer/orders/index')
            ->has('orders.data', 2)
        );
});

it('shows an order to its owner', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('orders.show', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consumer/orders/show')
            ->where('order.reference', $order->reference)
        );
});

it('forbids viewing another user order', function () {
    $order = Order::factory()->create();

    $this->actingAs(User::factory()->create())
        ->get(route('orders.show', $order))
        ->assertForbidden();
});

it('lets the consumer cancel a pending order', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($user)
        ->from(route('orders.show', $order))
        ->post(route('orders.cancel', $order), ['reason' => 'Changed my mind'])
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($order->fresh()->cancellation_reason)->toBe('Changed my mind');
});

it('cannot cancel an order past the pending stage', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->confirmed()->create();

    $this->actingAs($user)
        ->from(route('orders.show', $order))
        ->post(route('orders.cancel', $order))
        ->assertSessionHasErrors('status');

    expect($order->fresh()->status)->toBe(OrderStatus::Confirmed);
});

it('forbids cancelling another user order', function () {
    $order = Order::factory()->create(['status' => OrderStatus::Pending]);

    $this->actingAs(User::factory()->create())
        ->post(route('orders.cancel', $order))
        ->assertForbidden();
});
