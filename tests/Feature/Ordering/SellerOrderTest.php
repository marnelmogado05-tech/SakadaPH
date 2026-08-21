<?php

use App\Enums\FulfillmentType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;

/**
 * Create an approved seller with their store.
 *
 * @return array{0: User, 1: Store}
 */
function seller(): array
{
    $user = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($user)->create();

    return [$user, $store];
}

it('lists only the seller own store orders', function () {
    [$user, $store] = seller();
    Order::factory()->count(2)->for($store)->create();
    Order::factory()->create();

    $this->actingAs($user)
        ->get(route('seller.orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/orders/index')
            ->has('orders.data', 2)
        );
});

it('filters the queue by status', function () {
    [$user, $store] = seller();
    Order::factory()->for($store)->create(['status' => OrderStatus::Pending]);
    Order::factory()->for($store)->confirmed()->create();

    $this->actingAs($user)
        ->get(route('seller.orders.index', ['status' => 'pending']))
        ->assertInertia(fn ($page) => $page->has('orders.data', 1));
});

it('forbids viewing an order from another store', function () {
    [$user] = seller();
    $order = Order::factory()->create();

    $this->actingAs($user)
        ->get(route('seller.orders.show', $order))
        ->assertForbidden();
});

it('confirms a pending order', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($user)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.confirm', $order))
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Confirmed)
        ->and($order->fresh()->confirmed_at)->not->toBeNull();
});

it('rejects a pending order with a reason', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($user)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.reject', $order), ['reason' => 'Out of supply'])
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Rejected)
        ->and($order->fresh()->cancellation_reason)->toBe('Out of supply');
});

it('requires a reason to reject', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($user)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.reject', $order))
        ->assertSessionHasErrors('reason');
});

it('advances a pickup order through to completion', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->confirmed()->create([
        'fulfillment_type' => FulfillmentType::Pickup,
    ]);

    $advance = fn () => $this->actingAs($user)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.advance', $order));

    $advance();
    expect($order->fresh()->status)->toBe(OrderStatus::Preparing);

    $advance();
    expect($order->fresh()->status)->toBe(OrderStatus::ReadyForPickup);

    $advance();
    expect($order->fresh()->status)->toBe(OrderStatus::Completed);
});

it('routes a delivery order to out_for_delivery when advancing from preparing', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->delivery()->create([
        'status' => OrderStatus::Preparing,
    ]);

    $this->actingAs($user)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.advance', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::OutForDelivery);
});

it('marks a cash order paid automatically when completed', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->create([
        'status' => OrderStatus::ReadyForPickup,
        'fulfillment_type' => FulfillmentType::Pickup,
        'payment_status' => PaymentStatus::Unpaid,
    ]);

    $this->actingAs($user)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.advance', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::Completed)
        ->and($order->fresh()->payment_status)->toBe(PaymentStatus::Paid);
});

it('lets the seller record a cash payment before completion', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->confirmed()->create([
        'payment_status' => PaymentStatus::Unpaid,
    ]);

    $this->actingAs($user)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.mark-paid', $order))
        ->assertRedirect();

    expect($order->fresh()->payment_status)->toBe(PaymentStatus::Paid);
});

it('rejects advancing a terminal order with a 422', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->completed()->create();

    $this->actingAs($user)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.advance', $order))
        ->assertSessionHasErrors('status');
});

it('forbids a consumer from the seller order routes', function () {
    $order = Order::factory()->create();

    $this->actingAs(User::factory()->create())
        ->get(route('seller.orders.index'))
        ->assertForbidden();
});

it('tells the queue which actions each order allows', function () {
    [$user, $store] = seller();
    Order::factory()->for($store)->create([
        'status' => OrderStatus::Pending,
        'reference' => 'SKD-PENDING',
    ]);

    $this->actingAs($user)
        ->get(route('seller.orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('orders.data.0.reference', 'SKD-PENDING')
            ->where('orders.data.0.can_confirm', true)
            ->where('orders.data.0.can_reject', true)
        );
});

it('offers the next fulfilment step from the queue without opening the order', function () {
    [$user, $store] = seller();
    Order::factory()->for($store)->confirmed()->create([
        'fulfillment_type' => FulfillmentType::Delivery,
    ]);

    $this->actingAs($user)
        ->get(route('seller.orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('orders.data.0.can_confirm', false)
            ->where('orders.data.0.next_status_label', 'Preparing')
        );
});

it('offers no further step once an order is terminal', function () {
    [$user, $store] = seller();
    Order::factory()->for($store)->completed()->create();

    $this->actingAs($user)
        ->get(route('seller.orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('orders.data.0.can_confirm', false)
            ->where('orders.data.0.can_reject', false)
            ->where('orders.data.0.next_status_label', null)
        );
});

it('confirms straight from the queue and comes back to it', function () {
    [$user, $store] = seller();
    $order = Order::factory()->for($store)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($user)
        ->from(route('seller.orders.index'))
        ->post(route('seller.orders.confirm', $order))
        ->assertRedirect(route('seller.orders.index'));

    expect($order->fresh()->status)->toBe(OrderStatus::Confirmed);
});
