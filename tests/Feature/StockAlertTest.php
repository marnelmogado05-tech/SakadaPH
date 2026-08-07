<?php

use App\Enums\ProductAvailability;
use App\Jobs\SendStockAlert;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Notifications\StockRestoredNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    $seller = User::factory()->seller()->create();
    $this->store = Store::factory()->approved()->for($seller)->create();
    $this->product = Product::factory()->outOfStock()->for($this->store)->create();
    $this->consumer = User::factory()->create();
});

it('dispatches a SendStockAlert job when availability changes to in_stock', function () {
    Queue::fake();

    $this->actingAs($this->store->user)
        ->patch("/seller/products/{$this->product->id}/availability", [
            'availability' => 'in_stock',
        ])
        ->assertRedirect();

    Queue::assertPushed(SendStockAlert::class, fn ($job) => $job->product->is($this->product));
});

it('does not dispatch a job when availability does not change to in_stock', function () {
    Queue::fake();

    $this->actingAs($this->store->user)
        ->patch("/seller/products/{$this->product->id}/availability", [
            'availability' => 'low_stock',
        ])
        ->assertRedirect();

    Queue::assertNothingPushed();
});

it('does not dispatch a job when availability is already in_stock', function () {
    Queue::fake();

    $this->product->update(['availability' => ProductAvailability::InStock]);

    $this->actingAs($this->store->user)
        ->patch("/seller/products/{$this->product->id}/availability", [
            'availability' => 'in_stock',
        ])
        ->assertRedirect();

    Queue::assertNothingPushed();
});

it('sends a StockRestoredNotification to store followers', function () {
    Notification::fake();

    $this->consumer->followedStores()->attach($this->store->id);

    SendStockAlert::dispatch($this->product);

    Notification::assertSentTo($this->consumer, StockRestoredNotification::class);
});

it('does not send a notification to non-followers', function () {
    Notification::fake();

    $nonFollower = User::factory()->create();

    SendStockAlert::dispatch($this->product);

    Notification::assertNotSentTo($nonFollower, StockRestoredNotification::class);
});
