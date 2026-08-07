<?php

use App\Mail\SellerApproved;
use App\Mail\SellerRejected;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('redirects guests away from the sellers page', function () {
    $this->get('/admin/sellers')->assertRedirect('/login');
});

it('forbids consumers from the sellers page', function () {
    $consumer = User::factory()->create();

    $this->actingAs($consumer)->get('/admin/sellers')->assertForbidden();
});

it('forbids sellers from the sellers page', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)->get('/admin/sellers')->assertForbidden();
});

it('shows pending stores to admins', function () {
    $admin = User::factory()->admin()->create();
    $store = Store::factory()->pending()->create();

    $this->actingAs($admin)
        ->get('/admin/sellers')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/sellers/index')
            ->where('stores.total', 1)
            ->where('stores.data.0.id', $store->id)
            ->where('stores.data.0.status', 'pending')
        );
});

it('admin can approve a pending store and sends email', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $store = Store::factory()->pending()->create();

    $this->actingAs($admin)
        ->post("/admin/sellers/{$store->id}/approve")
        ->assertRedirect();

    $store->refresh();
    expect($store->isApproved())->toBeTrue();
    expect($store->approved_at)->not->toBeNull();
    expect($store->approved_by)->toBe($admin->id);

    Mail::assertQueued(SellerApproved::class, fn ($mail) => $mail->store->id === $store->id);
});

it('admin can reject a pending store with a reason and sends email', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $store = Store::factory()->pending()->create();

    $this->actingAs($admin)
        ->post("/admin/sellers/{$store->id}/reject", [
            'reason' => 'Missing business permit information.',
        ])
        ->assertRedirect();

    $store->refresh();
    expect($store->isRejected())->toBeTrue();
    expect($store->rejection_reason)->toBe('Missing business permit information.');
    expect($store->rejected_at)->not->toBeNull();

    Mail::assertQueued(SellerRejected::class, fn ($mail) => $mail->store->id === $store->id);
});

it('reject requires a reason', function () {
    $admin = User::factory()->admin()->create();
    $store = Store::factory()->pending()->create();

    $this->actingAs($admin)
        ->post("/admin/sellers/{$store->id}/reject", [])
        ->assertInvalid(['reason']);
});

it('ignores approve action on already-approved stores', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $store = Store::factory()->approved()->create();

    $this->actingAs($admin)
        ->post("/admin/sellers/{$store->id}/approve")
        ->assertRedirect();

    Mail::assertNotQueued(SellerApproved::class);
});

it('admin can suspend an approved store', function () {
    $admin = User::factory()->admin()->create();
    $store = Store::factory()->approved()->create();

    $this->actingAs($admin)
        ->post("/admin/sellers/{$store->id}/suspend", [
            'reason' => 'Violation of terms of service.',
        ])
        ->assertRedirect();

    $store->refresh();
    expect($store->isSuspended())->toBeTrue();
    expect($store->rejection_reason)->toBe('Violation of terms of service.');
});

it('suspend requires a reason', function () {
    $admin = User::factory()->admin()->create();
    $store = Store::factory()->approved()->create();

    $this->actingAs($admin)
        ->post("/admin/sellers/{$store->id}/suspend", [])
        ->assertInvalid(['reason']);
});

it('ignores suspend action on non-approved stores', function () {
    $admin = User::factory()->admin()->create();
    $store = Store::factory()->pending()->create();

    $this->actingAs($admin)
        ->post("/admin/sellers/{$store->id}/suspend", [
            'reason' => 'Some reason.',
        ])
        ->assertRedirect();

    $store->refresh();
    expect($store->isSuspended())->toBeFalse();
});
