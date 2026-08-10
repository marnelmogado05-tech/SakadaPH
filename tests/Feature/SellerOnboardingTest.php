<?php

use App\Models\Store;
use App\Models\User;
use App\Notifications\SellerRegisteredNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

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

it('notifies every admin when a seller registers', function () {
    Notification::fake();

    $admins = User::factory()->admin()->count(2)->create();

    $this->post('/register/seller', [
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'email' => 'juan@example.com',
        'contact_number' => '09123456789',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
        'store_name' => "Juan's Water Station",
        'store_address' => '123 Main St, Ilocos Norte',
    ]);

    Notification::assertSentTo($admins, SellerRegisteredNotification::class);
});

it('lets an admin view a seller registration notification in-app', function () {
    $admin = User::factory()->admin()->create();
    $store = Store::factory()->pending()->create();
    $admin->notify(new SellerRegisteredNotification($store));

    $this->actingAs($admin)
        ->get(route('notifications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('notifications')
            ->where('notifications.data.0.type', 'seller_registered')
            ->where('notifications.data.0.url_label', 'Review sellers')
        );
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
