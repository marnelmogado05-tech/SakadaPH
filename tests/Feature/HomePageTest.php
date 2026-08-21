<?php

use App\Models\Product;
use App\Models\Store;

it('leads with the most recently updated suppliers', function () {
    $stale = Store::factory()->approved()->create(['name' => 'Stale Station']);
    Product::factory()->for($stale)->create(['last_updated_at' => now()->subDays(3)]);

    $fresh = Store::factory()->approved()->create(['name' => 'Fresh Station']);
    Product::factory()->for($fresh)->create(['last_updated_at' => now()]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('recentlyUpdated', 2)
            ->where('recentlyUpdated.0.name', 'Fresh Station')
            ->where('recentlyUpdated.1.name', 'Stale Station')
        );
});

it('shows at most three suppliers on the landing page', function () {
    Store::factory()->approved()->count(5)->create()
        ->each(fn (Store $store) => Product::factory()->for($store)->create());

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('recentlyUpdated', 3));
});

it('never surfaces unapproved suppliers or empty stores', function () {
    $pending = Store::factory()->pending()->create();
    Product::factory()->for($pending)->create();

    $withoutProducts = Store::factory()->approved()->create();

    $listed = Store::factory()->approved()->create(['name' => 'Listed Station']);
    Product::factory()->for($listed)->create();

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('recentlyUpdated', 1)
            ->where('recentlyUpdated.0.name', 'Listed Station')
            ->where('supplierCount', 2)
        );

    expect($withoutProducts->products()->count())->toBe(0);
});

it('reports each supplier stock state and price range', function () {
    $store = Store::factory()->approved()->create();
    Product::factory()->for($store)->lowStock()->create(['price' => 25]);
    Product::factory()->for($store)->outOfStock()->create(['price' => 80]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('recentlyUpdated.0.store_availability', 'low_stock')
            ->where('recentlyUpdated.0.price_min', 25)
            ->where('recentlyUpdated.0.price_max', 80)
        );
});

it('still renders when no supplier has listed anything', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('recentlyUpdated', 0)
            ->where('supplierCount', 0)
        );
});
