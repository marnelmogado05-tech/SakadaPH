<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;

function consumer(): User
{
    return User::factory()->create();
}

it('adds a product to the cart and sets the store', function () {
    $user = consumer();
    $store = Store::factory()->approved()->create();
    $product = Product::factory()->for($store)->create();

    $this->actingAs($user)
        ->from(route('stores.show', $store))
        ->post(route('cart.store'), ['product_id' => $product->id, 'quantity' => 2])
        ->assertRedirect();

    $cart = $user->cart;
    expect($cart->store_id)->toBe($store->id)
        ->and($cart->items)->toHaveCount(1)
        ->and($cart->items->first()->quantity)->toBe(2);
});

it('increments quantity when the same product is added again', function () {
    $user = consumer();
    $product = Product::factory()->for(Store::factory()->approved())->create();

    $this->actingAs($user)->post(route('cart.store'), ['product_id' => $product->id, 'quantity' => 1]);
    $this->actingAs($user)->post(route('cart.store'), ['product_id' => $product->id, 'quantity' => 3]);

    expect($user->cart->items()->sum('quantity'))->toBe(4);
});

it('blocks adding an out of stock product', function () {
    $user = consumer();
    $product = Product::factory()->outOfStock()->for(Store::factory()->approved())->create();

    $this->actingAs($user)
        ->from(route('stores.show', $product->store))
        ->post(route('cart.store'), ['product_id' => $product->id])
        ->assertSessionHasErrors('product_id');

    expect($user->cart?->items ?? collect())->toHaveCount(0);
});

it('rejects adding a product from another store without force', function () {
    $user = consumer();
    $cart = Cart::factory()->for($user)->create(['store_id' => Store::factory()->approved()->create()->id]);
    CartItem::factory()->for($cart)->create();

    $otherProduct = Product::factory()->for(Store::factory()->approved())->create();

    $this->actingAs($user)
        ->from(route('cart.index'))
        ->post(route('cart.store'), ['product_id' => $otherProduct->id])
        ->assertSessionHasErrors('store_conflict');
});

it('replaces the cart when forcing a store switch', function () {
    $user = consumer();
    $cart = Cart::factory()->for($user)->create(['store_id' => Store::factory()->approved()->create()->id]);
    CartItem::factory()->for($cart)->create();

    $newStore = Store::factory()->approved()->create();
    $otherProduct = Product::factory()->for($newStore)->create();

    $this->actingAs($user)
        ->post(route('cart.store'), ['product_id' => $otherProduct->id, 'force' => true])
        ->assertRedirect();

    $cart->refresh();
    expect($cart->store_id)->toBe($newStore->id)
        ->and($cart->items)->toHaveCount(1)
        ->and($cart->items->first()->product_id)->toBe($otherProduct->id);
});

it('updates a cart item quantity', function () {
    $user = consumer();
    $cart = Cart::factory()->for($user)->create();
    $item = CartItem::factory()->for($cart)->create(['quantity' => 1]);

    $this->actingAs($user)
        ->patch(route('cart.items.update', $item), ['quantity' => 5])
        ->assertRedirect();

    expect($item->fresh()->quantity)->toBe(5);
});

it('removes a cart item and clears the store when empty', function () {
    $user = consumer();
    $store = Store::factory()->approved()->create();
    $cart = Cart::factory()->for($user)->create(['store_id' => $store->id]);
    $item = CartItem::factory()->for($cart)->create();

    $this->actingAs($user)
        ->delete(route('cart.items.destroy', $item))
        ->assertRedirect();

    $cart->refresh();
    expect($cart->items)->toHaveCount(0)
        ->and($cart->store_id)->toBeNull();
});

it('forbids acting on another user cart item', function () {
    $owner = consumer();
    $cart = Cart::factory()->for($owner)->create();
    $item = CartItem::factory()->for($cart)->create();

    $this->actingAs(consumer())
        ->delete(route('cart.items.destroy', $item))
        ->assertForbidden();
});

it('requires authentication to view the cart', function () {
    $this->get(route('cart.index'))->assertRedirect(route('login'));
});
