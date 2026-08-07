<?php

use App\Enums\StoreType;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('redirects guests away from the store edit page', function () {
    $this->get('/seller/store')->assertRedirect('/login');
});

it('forbids consumers from the store edit page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/seller/store')->assertForbidden();
});

it('redirects a pending seller away from the store edit page', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->pending()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/store')->assertRedirect('/seller/pending');
});

it('redirects a suspended seller away from the store edit page', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->suspended()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/store')->assertRedirect('/seller/suspended');
});

it('shows the store edit page to an approved seller', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->get('/seller/store')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('seller/store')
            ->has('store.name')
            ->has('store.address')
            ->has('store.type')
            ->has('storeTypes')
        );
});

it('updates store details', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->patch('/seller/store', [
            'name' => 'New Water Station Name',
            'address' => '456 Updated St, Manila',
            'description' => 'We deliver fresh clean water.',
            'contact_number' => '09987654321',
            'type' => 'delivery',
        ])
        ->assertRedirect('/seller/store');

    $store->refresh();
    expect($store->name)->toBe('New Water Station Name');
    expect($store->address)->toBe('456 Updated St, Manila');
    expect($store->description)->toBe('We deliver fresh clean water.');
    expect($store->contact_number)->toBe('09987654321');
    expect($store->type)->toBe(StoreType::Delivery);
});

it('updates store coordinates', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->patch('/seller/store', [
            'name' => $store->name,
            'address' => $store->address,
            'type' => 'both',
            'latitude' => 18.1974,
            'longitude' => 120.5960,
            'service_radius_km' => 5,
        ])
        ->assertRedirect('/seller/store');

    $store->refresh();
    expect($store->type)->toBe(StoreType::Both);
    expect(round((float) $store->latitude, 4))->toBe(18.1974);
    expect(round((float) $store->longitude, 4))->toBe(120.596);
    expect((float) $store->service_radius_km)->toBe(5.0);
});

it('validates required fields when updating store', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->patch('/seller/store', [])
        ->assertInvalid(['name', 'address', 'type']);
});

it('clears nullable optional fields when submitted empty', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->patch('/seller/store', [
            'name' => 'Minimal Station',
            'address' => '123 Main St',
            'description' => '',
            'contact_number' => '',
            'type' => 'pickup',
        ])
        ->assertRedirect('/seller/store');

    $store->refresh();
    expect($store->description)->toBeNull();
    expect($store->contact_number)->toBeNull();
});
