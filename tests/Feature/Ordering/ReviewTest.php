<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Review;
use App\Models\Store;
use App\Models\User;
use Inertia\Inertia;

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

it('confirms the review with wording that matches the button pressed', function () {
    $user = User::factory()->create();
    $order = Order::factory()->completed()->for($user)->create();

    $this->actingAs($user)
        ->post(route('orders.review', $order), ['rating' => 4])
        ->assertSessionHas('inertia.flash_data', fn ($flash) => $flash['toast']['message'] === 'Review submitted.');

    $this->actingAs($user)
        ->post(route('orders.review', $order), ['rating' => 5])
        ->assertSessionHas('inertia.flash_data', fn ($flash) => $flash['toast']['message'] === 'Review updated.');
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

    // The rating summary is above the fold and loads with the page; the review
    // list itself is deferred, so it arrives on a follow-up partial request.
    $this->get(route('stores.show', $store))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('store.rating_count', 1)
            ->where('store.rating_avg', 5)
            ->missing('reviews')
        );

    $this->get(route('stores.show', $store), [
        'X-Inertia' => 'true',
        'X-Inertia-Partial-Component' => 'stores/show',
        'X-Inertia-Partial-Data' => 'reviews',
        'X-Inertia-Version' => Inertia::getVersion(),
    ])
        ->assertOk()
        ->assertJsonCount(1, 'props.reviews')
        ->assertJsonPath('props.reviews.0.comment', 'Highly recommend')
        ->assertJsonPath('props.reviews.0.rating', 5);
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

it('derives user_id and store_id from the order when the factory is used bare', function () {
    $review = Review::factory()->create();

    $order = Order::find($review->order_id);
    expect($review->user_id)->toBe($order->user_id)
        ->and($review->store_id)->toBe($order->store_id);
});
