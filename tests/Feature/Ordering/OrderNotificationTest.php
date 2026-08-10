<?php

use App\Enums\FulfillmentType;
use App\Enums\OrderStatus;
use App\Enums\StoreType;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Notifications\OrderCancelledNotification;
use App\Notifications\OrderPlacedNotification;
use App\Notifications\OrderStatusUpdatedNotification;
use Illuminate\Support\Facades\Notification;

/**
 * @return array{0: User, 1: Store}
 */
function sellerWithStore(): array
{
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create(['type' => StoreType::Both]);

    return [$seller, $store];
}

function assertStatusType(User $consumer, string $expectedType): void
{
    Notification::assertSentTo(
        $consumer,
        OrderStatusUpdatedNotification::class,
        fn (OrderStatusUpdatedNotification $n) => $n->toArray($consumer)['type'] === $expectedType,
    );
}

it('notifies the seller when a consumer places an order', function () {
    Notification::fake();

    [$seller, $store] = sellerWithStore();
    $product = Product::factory()->for($store)->create();
    $consumer = User::factory()->create(['contact_number' => '09171234567']);
    $cart = Cart::factory()->for($consumer)->create(['store_id' => $store->id]);
    CartItem::factory()->for($cart)->create(['product_id' => $product->id, 'quantity' => 1]);

    $this->actingAs($consumer)->post(route('orders.store'), [
        'fulfillment_type' => FulfillmentType::Pickup->value,
        'payment_method' => 'cash',
        'contact_number' => '09171234567',
    ]);

    Notification::assertSentTo($seller, OrderPlacedNotification::class);
});

it('notifies the consumer when the seller confirms', function () {
    Notification::fake();

    [$seller, $store] = sellerWithStore();
    $consumer = User::factory()->create();
    $order = Order::factory()->for($store)->for($consumer)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($seller)->post(route('seller.orders.confirm', $order));

    assertStatusType($consumer, 'order_confirmed');
});

it('notifies the consumer when the seller rejects', function () {
    Notification::fake();

    [$seller, $store] = sellerWithStore();
    $consumer = User::factory()->create();
    $order = Order::factory()->for($store)->for($consumer)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($seller)->post(route('seller.orders.reject', $order), ['reason' => 'No stock']);

    assertStatusType($consumer, 'order_rejected');
});

it('does not notify the consumer when advancing to the internal preparing step', function () {
    Notification::fake();

    [$seller, $store] = sellerWithStore();
    $consumer = User::factory()->create();
    $order = Order::factory()->for($store)->for($consumer)->confirmed()->create([
        'fulfillment_type' => FulfillmentType::Pickup,
    ]);

    $this->actingAs($seller)->post(route('seller.orders.advance', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::Preparing);
    Notification::assertNotSentTo($consumer, OrderStatusUpdatedNotification::class);
});

it('notifies the consumer when the order is ready for pickup', function () {
    Notification::fake();

    [$seller, $store] = sellerWithStore();
    $consumer = User::factory()->create();
    $order = Order::factory()->for($store)->for($consumer)->create([
        'status' => OrderStatus::Preparing,
        'fulfillment_type' => FulfillmentType::Pickup,
    ]);

    $this->actingAs($seller)->post(route('seller.orders.advance', $order));

    assertStatusType($consumer, 'order_ready');
});

it('notifies the consumer when the order is completed', function () {
    Notification::fake();

    [$seller, $store] = sellerWithStore();
    $consumer = User::factory()->create();
    $order = Order::factory()->for($store)->for($consumer)->create([
        'status' => OrderStatus::ReadyForPickup,
        'fulfillment_type' => FulfillmentType::Pickup,
    ]);

    $this->actingAs($seller)->post(route('seller.orders.advance', $order));

    assertStatusType($consumer, 'order_completed');
});

it('notifies the seller when the consumer cancels', function () {
    Notification::fake();

    [$seller, $store] = sellerWithStore();
    $consumer = User::factory()->create();
    $order = Order::factory()->for($store)->for($consumer)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($consumer)->post(route('orders.cancel', $order), ['reason' => 'Changed my mind']);

    Notification::assertSentTo($seller, OrderCancelledNotification::class);
});

it('shows order notifications to the seller in-app', function () {
    [$seller, $store] = sellerWithStore();
    $order = Order::factory()->for($store)->create();
    $seller->notify(new OrderPlacedNotification($order));

    $this->actingAs($seller)
        ->get(route('notifications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('notifications')
            ->has('notifications.data', 1)
            ->where('notifications.data.0.type', 'order_placed')
            ->where('notifications.data.0.url', "/seller/orders/{$order->id}")
        );
});

it('stores the order link in the notification payload', function () {
    [$seller, $store] = sellerWithStore();
    $consumer = User::factory()->create();
    $order = Order::factory()->for($store)->for($consumer)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($seller)->post(route('seller.orders.confirm', $order));

    $notification = $consumer->fresh()->notifications()->first();
    expect($notification->data['type'])->toBe('order_confirmed')
        ->and($notification->data['url'])->toBe("/orders/{$order->id}")
        ->and($notification->data['order_reference'])->toBe($order->reference);
});
