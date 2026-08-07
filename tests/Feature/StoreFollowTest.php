<?php

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->consumer = User::factory()->create();
    $seller = User::factory()->seller()->create();
    $this->store = Store::factory()->approved()->for($seller)->create();
});

it('allows a consumer to follow an approved store', function () {
    $this->actingAs($this->consumer)
        ->post("/stores/{$this->store->id}/follow")
        ->assertRedirect();

    expect($this->consumer->followedStores()->where('store_id', $this->store->id)->exists())->toBeTrue();
});

it('does not duplicate a follow when following twice', function () {
    $this->actingAs($this->consumer)
        ->post("/stores/{$this->store->id}/follow");

    $this->actingAs($this->consumer)
        ->post("/stores/{$this->store->id}/follow");

    expect($this->consumer->followedStores()->where('store_id', $this->store->id)->count())->toBe(1);
});

it('allows a consumer to unfollow a store', function () {
    $this->consumer->followedStores()->attach($this->store->id);

    $this->actingAs($this->consumer)
        ->post("/stores/{$this->store->id}/unfollow")
        ->assertRedirect();

    expect($this->consumer->followedStores()->where('store_id', $this->store->id)->exists())->toBeFalse();
});

it('rejects follow on a non-approved store', function () {
    $seller = User::factory()->seller()->create();
    $pendingStore = Store::factory()->pending()->for($seller)->create();

    $this->actingAs($this->consumer)
        ->post("/stores/{$pendingStore->id}/follow")
        ->assertNotFound();
});

it('requires authentication to follow', function () {
    $this->post("/stores/{$this->store->id}/follow")
        ->assertRedirect('/login');
});

it('shows followed stores on the following page', function () {
    $this->consumer->followedStores()->attach($this->store->id);

    $this->actingAs($this->consumer)
        ->get('/following')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stores/following')
            ->has('stores', 1)
            ->where('stores.0.id', $this->store->id)
        );
});

it('shows is_followed flag on store show page for following consumer', function () {
    $this->consumer->followedStores()->attach($this->store->id);

    $this->actingAs($this->consumer)
        ->get("/stores/{$this->store->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('store.is_followed', true)
            ->where('store.can_follow', true)
        );
});

it('shows is_followed as false on store show page for non-following consumer', function () {
    $this->actingAs($this->consumer)
        ->get("/stores/{$this->store->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('store.is_followed', false)
            ->where('store.can_follow', true)
        );
});

it('does not show follow button to guests', function () {
    $this->get("/stores/{$this->store->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('store.can_follow', false)
        );
});
