<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Review;
use App\Models\Store;
use App\Models\User;

it('lets a consumer review their completed order', function () {
    $user = User::factory()->create();
    $store = Store::factory()->approved()->create();
    $order = Order::factory()->completed()->for($user)->for($store)->create();

    $this->actingAs($user)
        ->from(route('orders.show', $order))
        ->post(route('orders.review', $order), ['rating' => 5, 'comment' => 'Fast and clean water!'])
        ->assertRedirect();

    $review = Review::first();
    expect($review)->not->toBeNull()
        ->and($review->order_id)->toBe($order->id)
        ->and($review->user_id)->toBe($user->id)
        ->and($review->store_id)->toBe($store->id)
        ->and($review->rating)->toBe(5)
        ->and($review->comment)->toBe('Fast and clean water!');
});

it('updates the existing review instead of creating a second one', function () {
    $user = User::factory()->create();
    $order = Order::factory()->completed()->for($user)->create();

    $this->actingAs($user)->post(route('orders.review', $order), ['rating' => 3]);
    $this->actingAs($user)->post(route('orders.review', $order), ['rating' => 5, 'comment' => 'Even better second time']);

    expect(Review::count())->toBe(1)
        ->and(Review::first()->rating)->toBe(5)
        ->and(Review::first()->comment)->toBe('Even better second time');
});

it('blocks reviewing an order that is not completed', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create(['status' => OrderStatus::Pending]);

    $this->actingAs($user)
        ->from(route('orders.show', $order))
        ->post(route('orders.review', $order), ['rating' => 5])
        ->assertSessionHasErrors('rating');

    expect(Review::count())->toBe(0);
});

it('forbids reviewing another user order', function () {
    $order = Order::factory()->completed()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('orders.review', $order), ['rating' => 5])
        ->assertForbidden();
});

it('validates the rating is between 1 and 5', function () {
    $user = User::factory()->create();
    $order = Order::factory()->completed()->for($user)->create();

    $this->actingAs($user)
        ->from(route('orders.show', $order))
        ->post(route('orders.review', $order), ['rating' => 6])
        ->assertSessionHasErrors('rating');

    $this->actingAs($user)
        ->from(route('orders.show', $order))
        ->post(route('orders.review', $order), ['rating' => 0])
        ->assertSessionHasErrors('rating');
});

it('exposes review state on the consumer order detail', function () {
    $user = User::factory()->create();
    $order = Order::factory()->completed()->for($user)->create();
    Review::factory()->create(['order_id' => $order->id, 'user_id' => $user->id, 'store_id' => $order->store_id, 'rating' => 4]);

    $this->actingAs($user)
        ->get(route('orders.show', $order))
        ->assertInertia(fn ($page) => $page
            ->where('order.can_review', true)
            ->where('order.review.rating', 4)
        );
});

it('shows the store rating and reviews on its public profile', function () {
    $store = Store::factory()->approved()->create();
    $order = Order::factory()->completed()->for($store)->create();
    Review::factory()->create([
        'order_id' => $order->id,
        'user_id' => $order->user_id,
        'store_id' => $store->id,
        'rating' => 5,
        'comment' => 'Highly recommend',
    ]);

    $this->get(route('stores.show', $store))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('store.rating_count', 1)
            ->where('store.rating_avg', 5)
            ->has('reviews', 1)
            ->where('reviews.0.comment', 'Highly recommend')
        );
});

it('reflects the review in the seller order detail', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    $order = Order::factory()->completed()->for($store)->create();
    Review::factory()->create([
        'order_id' => $order->id,
        'user_id' => $order->user_id,
        'store_id' => $store->id,
        'rating' => 2,
    ]);

    $this->actingAs($seller)
        ->get(route('seller.orders.show', $order))
        ->assertInertia(fn ($page) => $page->where('order.review.rating', 2));
});
