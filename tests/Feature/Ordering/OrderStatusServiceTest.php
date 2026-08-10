<?php

use App\Enums\FulfillmentType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\OrderStatusService;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function () {
    $this->status = new OrderStatusService;
});

it('allows a legal pending to confirmed transition and stamps confirmed_at', function () {
    $order = Order::factory()->create(['status' => OrderStatus::Pending]);

    $this->status->transition($order, OrderStatus::Confirmed);

    expect($order->fresh()->status)->toBe(OrderStatus::Confirmed)
        ->and($order->fresh()->confirmed_at)->not->toBeNull();
});

it('stamps completed_at when completing', function () {
    $order = Order::factory()->create([
        'status' => OrderStatus::ReadyForPickup,
        'fulfillment_type' => FulfillmentType::Pickup,
    ]);

    $this->status->transition($order, OrderStatus::Completed);

    expect($order->fresh()->status)->toBe(OrderStatus::Completed)
        ->and($order->fresh()->completed_at)->not->toBeNull();
});

it('records the reason and cancelled_at when cancelling', function () {
    $order = Order::factory()->create(['status' => OrderStatus::Pending]);

    $this->status->transition($order, OrderStatus::Cancelled, 'Changed my mind');

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($order->fresh()->cancellation_reason)->toBe('Changed my mind')
        ->and($order->fresh()->cancelled_at)->not->toBeNull();
});

it('aborts with 422 on an illegal transition', function () {
    $order = Order::factory()->create(['status' => OrderStatus::Pending]);

    try {
        $this->status->transition($order, OrderStatus::Completed);
        $this->fail('Expected an illegal transition to abort.');
    } catch (HttpException $e) {
        expect($e->getStatusCode())->toBe(422);
    }

    expect($order->fresh()->status)->toBe(OrderStatus::Pending);
});

it('cannot transition out of a terminal status', function () {
    $order = Order::factory()->completed()->create();

    expect($this->status->canTransition($order, OrderStatus::Preparing))->toBeFalse();
});

it('only allows ready_for_pickup for pickup orders', function () {
    $pickup = Order::factory()->create([
        'status' => OrderStatus::Preparing,
        'fulfillment_type' => FulfillmentType::Pickup,
    ]);
    $delivery = Order::factory()->delivery()->create([
        'status' => OrderStatus::Preparing,
    ]);

    expect($this->status->canTransition($pickup, OrderStatus::ReadyForPickup))->toBeTrue()
        ->and($this->status->canTransition($pickup, OrderStatus::OutForDelivery))->toBeFalse()
        ->and($this->status->canTransition($delivery, OrderStatus::OutForDelivery))->toBeTrue()
        ->and($this->status->canTransition($delivery, OrderStatus::ReadyForPickup))->toBeFalse();
});
