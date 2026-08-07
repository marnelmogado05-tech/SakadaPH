<?php

use App\Enums\StoreType;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows the public store listing to guests', function () {
    $this->get('/stores')->assertOk();
});

it('shows only approved stores on the listing', function () {
    Store::factory()->approved()->count(3)->create();
    Store::factory()->pending()->create();
    Store::factory()->rejected()->create();
    Store::factory()->suspended()->create();

    $this->get('/stores')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stores/index')
            ->where('stores.total', 3)
        );
});

it('filters stores by search term', function () {
    Store::factory()->approved()->create(['name' => 'Aqua Supreme Ilocos']);
    Store::factory()->approved()->create(['name' => 'Pure Water Manila']);
    Store::factory()->approved()->create(['name' => 'Crystal Clear Cebu', 'address' => 'Cebu City']);

    $this->get('/stores?search=Ilocos')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stores.total', 1)
            ->where('stores.data.0.name', 'Aqua Supreme Ilocos')
        );
});

it('filters stores by type', function () {
    Store::factory()->approved()->create(['type' => StoreType::Pickup, 'name' => 'Pickup Store']);
    Store::factory()->approved()->create(['type' => StoreType::Delivery, 'name' => 'Delivery Store']);
    Store::factory()->approved()->create(['type' => StoreType::Both, 'name' => 'Both Store']);

    $this->get('/stores?type=pickup')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stores.total', 1)
            ->where('stores.data.0.name', 'Pickup Store')
        );
});

it('filters stores with in_stock_only to those with available products', function () {
    $storeWithStock = Store::factory()->approved()->create(['name' => 'Has Stock']);
    Product::factory()->inStock()->for($storeWithStock)->create();

    $storeAllOut = Store::factory()->approved()->create(['name' => 'All Out']);
    Product::factory()->outOfStock()->for($storeAllOut)->create();

    Store::factory()->approved()->create(['name' => 'No Products']);

    $this->get('/stores?in_stock_only=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stores.total', 1)
            ->where('stores.data.0.name', 'Has Stock')
        );
});

it('returns store availability status in response', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    Product::factory()->inStock()->for($store)->create();

    $this->get('/stores')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stores.data.0.store_availability', 'in_stock')
        );
});

it('returns price range in response', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    Product::factory()->for($store)->create(['price' => 35.50]);
    Product::factory()->for($store)->create(['price' => 120.50]);

    $this->get('/stores')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stores.data.0.price_min', 35.5)
            ->where('stores.data.0.price_max', 120.5)
        );
});

it('returns 404 for a non-approved store profile', function () {
    $store = Store::factory()->pending()->create();

    $this->get("/stores/{$store->id}")->assertNotFound();
});

it('returns 404 for a suspended store profile', function () {
    $store = Store::factory()->suspended()->create();

    $this->get("/stores/{$store->id}")->assertNotFound();
});

it('shows an approved store profile with available products', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    Product::factory()->count(2)->inStock()->for($store)->create();
    Product::factory()->lowStock()->for($store)->create();
    Product::factory()->outOfStock()->for($store)->create();

    $this->get("/stores/{$store->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stores/show')
            ->where('store.id', $store->id)
            ->has('products', 3)
        );
});

it('shows store listing to authenticated consumers', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/stores')->assertOk();
});

it('includes latitude and longitude in the store listing response', function () {
    Store::factory()->approved()->create([
        'latitude' => 14.5995,
        'longitude' => 120.9842,
    ]);

    $this->get('/stores')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stores.data.0.latitude', 14.5995)
            ->where('stores.data.0.longitude', 120.9842)
        );
});

it('passes filters back to the view', function () {
    $this->get('/stores?search=test&type=pickup&in_stock_only=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.search', 'test')
            ->where('filters.type', 'pickup')
            ->where('filters.in_stock_only', true)
        );
});
