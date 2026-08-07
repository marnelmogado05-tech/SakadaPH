<?php

use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

it('shows the admin dashboard with stats', function () {
    $this->actingAs($this->admin)
        ->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('stats.pending_approvals')
            ->has('stats.approved_sellers')
            ->has('stats.total_consumers')
            ->has('stats.stale_stores')
            ->has('stats.in_stock_stores')
        );
});

it('counts pending approvals and approved sellers correctly', function () {
    Store::factory()->pending()->count(2)->create();
    Store::factory()->approved()->create();

    $this->actingAs($this->admin)
        ->get('/admin/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('stats.pending_approvals', 2)
            ->where('stats.approved_sellers', 1)
        );
});

it('counts total consumers correctly', function () {
    User::factory()->count(3)->create();
    User::factory()->seller()->count(2)->create();

    $this->actingAs($this->admin)
        ->get('/admin/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('stats.total_consumers', 3)
        );
});

it('counts in_stock_stores correctly', function () {
    $storeWithStock = Store::factory()->approved()->create();
    Product::factory()->inStock()->for($storeWithStock)->create();
    Store::factory()->approved()->create();

    $this->actingAs($this->admin)
        ->get('/admin/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('stats.in_stock_stores', 1)
        );
});

it('counts stale stores with no products', function () {
    Store::factory()->approved()->create();

    $this->actingAs($this->admin)
        ->get('/admin/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('stats.stale_stores', 1)
        );
});

it('redirects non-admins away from admin dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get('/admin/dashboard')->assertForbidden();
});
