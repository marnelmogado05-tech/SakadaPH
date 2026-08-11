<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('shows the consumer dashboard with order stats and recent orders', function () {
    $this->actingAs($this->user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('stats.total_orders')
            ->has('stats.active_orders')
            ->has('stats.completed_orders')
            ->has('stats.total_spent')
            ->has('recent_orders')
        );
});

it('counts order stats correctly', function () {
    Order::factory()->for($this->user)->completed()->count(2)->create();
    Order::factory()->for($this->user)->cancelled()->create();
    Order::factory()->for($this->user)->create();

    $this->actingAs($this->user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('stats.total_orders', 4)
            ->where('stats.active_orders', 1)
            ->where('stats.completed_orders', 2)
        );
});

it('lists recent orders for the authenticated consumer only', function () {
    $order = Order::factory()->for($this->user)->create();
    Order::factory()->create();

    $this->actingAs($this->user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('recent_orders', 1)
            ->where('recent_orders.0.id', $order->id)
        );
});
