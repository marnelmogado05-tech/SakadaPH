<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;

/**
 * The pending-order count drives the badge on the seller's sidebar and, below
 * lg, on the bottom navigation — so it is shared with every page.
 */
it('shares the seller pending order count', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();

    Order::factory()->count(2)->for($store)->create(['status' => OrderStatus::Pending]);
    Order::factory()->for($store)->completed()->create();

    $this->actingAs($seller)
        ->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('auth.seller_pending_orders_count', 2));
});

it('reports no pending orders for a seller with a clear queue', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->get(route('seller.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('auth.seller_pending_orders_count', 0));
});

it('never counts pending orders for a non-seller', function () {
    $store = Store::factory()->approved()->create();
    Order::factory()->count(3)->for($store)->create(['status' => OrderStatus::Pending]);

    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('auth.seller_pending_orders_count', 0));
});
