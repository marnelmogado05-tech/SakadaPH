<?php

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows the seller registration page to guests', function () {
    $this->get('/register/seller')->assertOk();
});

it('redirects authenticated users away from seller registration', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/register/seller')->assertRedirect();
});

it('registers a seller with a pending store', function () {
    $response = $this->post('/register/seller', [
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'email' => 'juan@example.com',
        'contact_number' => '09123456789',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
        'store_name' => "Juan's Water Station",
        'store_address' => '123 Main St, Ilocos Norte',
    ]);

    $response->assertRedirect('/seller/pending');

    $user = User::where('email', 'juan@example.com')->firstOrFail();
    expect($user->role->value)->toBe('seller');

    $store = $user->store;
    expect($store)->not->toBeNull();
    expect($store->name)->toBe("Juan's Water Station");
    expect($store->isPending())->toBeTrue();
});

it('validates required seller registration fields', function () {
    $this->post('/register/seller', [])->assertInvalid([
        'first_name',
        'last_name',
        'email',
        'password',
        'store_name',
        'store_address',
    ]);
});

it('shows the pending page to a pending seller', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->pending()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/pending')->assertOk();
});

it('redirects a pending seller away from the dashboard', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->pending()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/dashboard')->assertRedirect('/seller/pending');
});

it('allows an approved seller to access the dashboard', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/dashboard')->assertOk();
});

it('redirects a pending seller to the pending page after login', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->pending()->for($seller)->create();

    $this->post('/login', [
        'email' => $seller->email,
        'password' => 'password',
    ])->assertRedirect('/seller/pending');
});

it('redirects an approved seller to the dashboard after login', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->post('/login', [
        'email' => $seller->email,
        'password' => 'password',
    ])->assertRedirect('/seller/dashboard');
});
