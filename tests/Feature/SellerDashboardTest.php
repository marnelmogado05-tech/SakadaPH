<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;

/**
 * An approved seller with their store.
 *
 * @return array{0: User, 1: Store}
 */
function dashboardSeller(): array
{
    $user = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($user)->create();

    return [$user, $store];
}

it('leads with the orders and stock waiting on the seller', function () {
    [$user, $store] = dashboardSeller();
    Order::factory()->count(3)->for($store)->create(['status' => OrderStatus::Pending]);
    Order::factory()->for($store)->completed()->create();
    Product::factory()->count(2)->for($store)->outOfStock()->create();
    Product::factory()->for($store)->inStock()->create();

    $this->actingAs($user)
        ->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('attention.pending_orders', 3)
            ->where('attention.out_of_stock', 2)
        );
});

it('reports nothing waiting when the queue is clear and stock is good', function () {
    [$user, $store] = dashboardSeller();
    Product::factory()->for($store)->inStock()->create();

    $this->actingAs($user)
        ->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('attention.pending_orders', 0)
            ->where('attention.out_of_stock', 0)
        );
});

it('keeps the per-store figures on the first response', function () {
    [$user, $store] = dashboardSeller();
    Product::factory()->for($store)->inStock()->create();

    $this->actingAs($user)
        ->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('rating')
            ->has('recent_products')
            ->has('stats')
        );
});
