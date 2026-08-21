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

it('leads with what needs a person, naming the stale stores', function () {
    Store::factory()->pending()->count(2)->create();
    $stale = Store::factory()->approved()->create(['name' => 'Dormant Refilling']);
    Product::factory()->for($stale)->create(['last_updated_at' => now()->subDays(30)]);

    $fresh = Store::factory()->approved()->create(['name' => 'Busy Refilling']);
    Product::factory()->for($fresh)->create(['last_updated_at' => now()]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('attention.pending_approvals', 2)
            ->where('attention.stale_count', 1)
            ->has('attention.stale_stores', 1)
            ->where('attention.stale_stores.0.name', 'Dormant Refilling')
        );
});

it('caps the named stale stores but still reports the true count', function () {
    Store::factory()->approved()->count(8)->create()
        ->each(fn (Store $store) => Product::factory()->for($store)
            ->create(['last_updated_at' => now()->subDays(30)]));

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('attention.stale_count', 8)
            ->has('attention.stale_stores', 5)
        );
});

it('streams the platform order totals in rather than blocking first paint', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('stats')
            ->has('attention')
            ->missing('orderStats')
        );

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'), [
            'X-Inertia' => 'true',
            'X-Inertia-Partial-Component' => 'admin/dashboard',
            'X-Inertia-Partial-Data' => 'orderStats',
            'X-Inertia-Version' => Inertia\Inertia::getVersion(),
        ])
        ->assertOk()
        ->assertJsonPath('props.orderStats.total_orders', 0);
});
