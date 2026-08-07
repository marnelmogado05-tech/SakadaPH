<?php

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;

it('redirects guests to login when accessing protected routes', function () {
    $this->get('/admin/dashboard')->assertRedirect('/login');
    $this->get('/seller/dashboard')->assertRedirect('/login');
    $this->get('/dashboard')->assertRedirect('/login');
});

it('forbids consumers from admin routes', function () {
    $user = User::factory()->create(['role' => UserRole::User]);

    $this->actingAs($user)->get('/admin/dashboard')->assertForbidden();
});

it('forbids consumers from seller routes', function () {
    $user = User::factory()->create(['role' => UserRole::User]);

    $this->actingAs($user)->get('/seller/dashboard')->assertForbidden();
});

it('forbids sellers from admin routes', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)->get('/admin/dashboard')->assertForbidden();
});

it('forbids admins from seller routes', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get('/seller/dashboard')->assertForbidden();
});

it('allows approved sellers to access the seller dashboard', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)->get('/seller/dashboard')->assertOk();
});

it('allows admins to access the admin dashboard', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get('/admin/dashboard')->assertOk();
});

it('allows consumers to access the consumer dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/dashboard')->assertOk();
});

it('redirects admin to admin dashboard after login', function () {
    $admin = User::factory()->admin()->create();

    $this->post('/login', [
        'email' => $admin->email,
        'password' => 'password',
    ])->assertRedirect('/admin/dashboard');
});

it('redirects approved seller to seller dashboard after login', function () {
    $seller = User::factory()->seller()->create();
    Store::factory()->approved()->for($seller)->create();

    $this->post('/login', [
        'email' => $seller->email,
        'password' => 'password',
    ])->assertRedirect('/seller/dashboard');
});

it('redirects consumer to dashboard after login', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect('/dashboard');
});
