<?php

use App\Enums\ProductAvailability;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('redirects guests away from products', function () {
    $this->get('/seller/products')->assertRedirect('/login');
});

it('forbids pending sellers from products', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->pending()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/products')->assertRedirect('/seller/pending');
});

it('redirects suspended sellers away from products', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->suspended()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/products')->assertRedirect('/seller/suspended');
});

it('shows product list to approved seller', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    Product::factory()->count(3)->for($store)->create();

    $this->actingAs($seller)
        ->get('/seller/products')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/products/index')
            ->has('products', 3)
        );
});

it('shows the create product page', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/products/create')->assertOk();
});

it('creates a product', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->post('/seller/products', [
            'name' => '5-Gallon Water',
            'price' => '35.00',
            'unit' => 'gallon',
            'quantity' => 50,
            'availability' => 'in_stock',
        ])
        ->assertRedirect('/seller/products');

    expect($store->products()->count())->toBe(1);
    expect($store->products()->first()->name)->toBe('5-Gallon Water');
    expect($store->products()->first()->availability)->toBe(ProductAvailability::InStock);
});

it('validates required product fields', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->post('/seller/products', [])
        ->assertInvalid(['name', 'price', 'unit', 'quantity', 'availability']);
});

it('shows the edit product page', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    $product = Product::factory()->for($store)->create();

    $this->actingAs($seller)
        ->get("/seller/products/{$product->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/products/edit')
            ->where('product.id', $product->id)
        );
});

it('updates a product', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    $product = Product::factory()->for($store)->create();

    $this->actingAs($seller)
        ->put("/seller/products/{$product->id}", [
            'name' => 'Updated Name',
            'price' => '50.00',
            'unit' => 'liter',
            'quantity' => 10,
            'availability' => 'out_of_stock',
        ])
        ->assertRedirect('/seller/products');

    $product->refresh();
    expect($product->name)->toBe('Updated Name');
    expect($product->availability)->toBe(ProductAvailability::OutOfStock);
});

it('updates product availability via toggle', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    $product = Product::factory()->inStock()->for($store)->create();

    $this->actingAs($seller)
        ->patch("/seller/products/{$product->id}/availability", [
            'availability' => 'low_stock',
        ])
        ->assertRedirect();

    $product->refresh();
    expect($product->availability)->toBe(ProductAvailability::LowStock);
});

it('forbids editing another stores product', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $otherSeller = User::factory()->seller()->create();
    $otherStore = Store::factory()->approved()->for($otherSeller)->create();
    $otherProduct = Product::factory()->for($otherStore)->create();

    $this->actingAs($seller)
        ->get("/seller/products/{$otherProduct->id}/edit")
        ->assertForbidden();
});

it('deletes a product', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();
    $product = Product::factory()->for($store)->create();

    $this->actingAs($seller)
        ->delete("/seller/products/{$product->id}")
        ->assertRedirect('/seller/products');

    expect(Product::find($product->id))->toBeNull();
});
