<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\StoreType;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function gcashStore(?User $seller = null): Store
{
    return Store::factory()->approved()
        ->for($seller ?? User::factory()->seller())
        ->create([
            'type' => StoreType::Both,
            'accepts_online_payment' => true,
            'gcash_number' => '09171234567',
        ]);
}

/**
 * @return array{0: User, 1: Store}
 */
function consumerWithGcashCart(): array
{
    $store = gcashStore();
    $product = Product::factory()->for($store)->create(['price' => 100]);
    $consumer = User::factory()->create(['contact_number' => '09990001111']);
    $cart = Cart::factory()->for($consumer)->create(['store_id' => $store->id]);
    CartItem::factory()->for($cart)->create(['product_id' => $product->id, 'quantity' => 2]);

    return [$consumer, $store];
}

it('lets a seller save their GCash number and QR', function () {
    Storage::fake('public');
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->patch('/seller/store', [
            'name' => $store->name,
            'address' => $store->address,
            'type' => 'both',
            'accepts_online_payment' => true,
            'gcash_number' => '09171234567',
            'gcash_qr' => UploadedFile::fake()->create('qr.png', 100, 'image/png'),
        ])
        ->assertRedirect('/seller/store');

    $store->refresh();
    expect($store->accepts_online_payment)->toBeTrue()
        ->and($store->gcash_number)->toBe('09171234567')
        ->and($store->gcash_qr_path)->not->toBeNull();
    Storage::disk('public')->assertExists($store->gcash_qr_path);
});

it('requires a GCash number when enabling online payment', function () {
    $seller = User::factory()->seller()->create();
    $store = Store::factory()->approved()->for($seller)->create();

    $this->actingAs($seller)
        ->patch('/seller/store', [
            'name' => $store->name,
            'address' => $store->address,
            'type' => 'both',
            'accepts_online_payment' => true,
        ])
        ->assertSessionHasErrors('gcash_number');
});

it('offers GCash at checkout only when the store enabled it', function () {
    [$consumer] = consumerWithGcashCart();

    $this->actingAs($consumer)
        ->get(route('checkout.show'))
        ->assertInertia(fn ($page) => $page
            ->where('paymentMethods', fn ($methods) => collect($methods)->pluck('value')->contains('gcash'))
        );
});

it('places a GCash order as pending with a payment row', function () {
    [$consumer] = consumerWithGcashCart();

    $this->actingAs($consumer)
        ->post(route('orders.store'), [
            'fulfillment_type' => 'pickup',
            'payment_method' => 'gcash',
            'contact_number' => '09990001111',
        ])
        ->assertRedirect();

    $order = Order::first();
    expect($order->payment_method)->toBe(PaymentMethod::GCash)
        ->and($order->payment_status)->toBe(PaymentStatus::Pending)
        ->and($order->status)->toBe(OrderStatus::Pending);

    $payment = Payment::first();
    expect($payment)->not->toBeNull()
        ->and($payment->provider)->toBe('gcash_manual')
        ->and($payment->status)->toBe('pending')
        ->and((float) $payment->amount)->toBe(200.0);
});

it('rejects GCash when the store does not accept it', function () {
    $store = Store::factory()->approved()->create([
        'type' => StoreType::Both,
        'accepts_online_payment' => false,
    ]);
    $product = Product::factory()->for($store)->create();
    $consumer = User::factory()->create(['contact_number' => '09990001111']);
    $cart = Cart::factory()->for($consumer)->create(['store_id' => $store->id]);
    CartItem::factory()->for($cart)->create(['product_id' => $product->id]);

    $this->actingAs($consumer)
        ->from(route('checkout.show'))
        ->post(route('orders.store'), [
            'fulfillment_type' => 'pickup',
            'payment_method' => 'gcash',
            'contact_number' => '09990001111',
        ])
        ->assertSessionHasErrors('payment_method');

    expect(Order::count())->toBe(0);
});

it('lets the consumer submit a GCash reference', function () {
    $consumer = User::factory()->create();
    $store = gcashStore();
    $order = Order::factory()->for($consumer)->for($store)->online()->create();
    Payment::factory()->for($order)->create(['provider' => 'gcash_manual', 'status' => 'pending', 'provider_reference' => null]);

    $this->actingAs($consumer)
        ->from(route('orders.show', $order))
        ->post(route('orders.gcash-reference', $order), ['reference' => '9876543210123'])
        ->assertRedirect();

    expect($order->payments()->first()->provider_reference)->toBe('9876543210123');
});

it('forbids submitting a reference on another user order', function () {
    $store = gcashStore();
    $order = Order::factory()->for($store)->online()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('orders.gcash-reference', $order), ['reference' => '123'])
        ->assertForbidden();
});

it('rejects a reference on a cash order', function () {
    $consumer = User::factory()->create();
    $order = Order::factory()->for($consumer)->create(['payment_method' => PaymentMethod::Cash]);

    $this->actingAs($consumer)
        ->from(route('orders.show', $order))
        ->post(route('orders.gcash-reference', $order), ['reference' => '123'])
        ->assertSessionHasErrors('reference');
});

it('lets the seller confirm a GCash payment', function () {
    $seller = User::factory()->seller()->create();
    $store = gcashStore($seller);
    $order = Order::factory()->for($store)->online()->confirmed()->create();
    Payment::factory()->for($order)->create(['provider' => 'gcash_manual', 'status' => 'pending']);

    $this->actingAs($seller)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.mark-paid', $order))
        ->assertRedirect();

    expect($order->fresh()->payment_status)->toBe(PaymentStatus::Paid)
        ->and($order->payments()->first()->status)->toBe('paid');
});

it('blocks completing a GCash order before payment is confirmed', function () {
    $seller = User::factory()->seller()->create();
    $store = gcashStore($seller);
    $order = Order::factory()->for($store)->online()->create([
        'status' => OrderStatus::ReadyForPickup,
        'fulfillment_type' => 'pickup',
    ]);

    $this->actingAs($seller)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.advance', $order))
        ->assertSessionHasErrors('status');

    expect($order->fresh()->status)->toBe(OrderStatus::ReadyForPickup);
});

it('completes a GCash order once payment is confirmed', function () {
    $seller = User::factory()->seller()->create();
    $store = gcashStore($seller);
    $order = Order::factory()->for($store)->online()->paid()->create([
        'status' => OrderStatus::ReadyForPickup,
        'fulfillment_type' => 'pickup',
    ]);

    $this->actingAs($seller)
        ->from(route('seller.orders.show', $order))
        ->post(route('seller.orders.advance', $order))
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Completed)
        ->and($order->fresh()->payment_status)->toBe(PaymentStatus::Paid);
});
