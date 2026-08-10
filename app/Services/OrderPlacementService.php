<?php

namespace App\Services;

use App\Enums\FulfillmentType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\ProductAvailability;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderPlacementService
{
    public function __construct(private OrderPricingService $pricing) {}

    /**
     * Validate the cart and checkout input, then create an order with snapshotted
     * line items inside a transaction. Cash-only for this slice.
     *
     * @param  array{fulfillment_type: FulfillmentType, payment_method: PaymentMethod, contact_number: string, delivery_address?: string|null, delivery_latitude?: float|null, delivery_longitude?: float|null, notes?: string|null}  $data
     */
    public function place(User $user, array $data): Order
    {
        $cart = $user->cart?->load('items.product', 'store');

        if ($cart === null || $cart->items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Your cart is empty.',
            ]);
        }

        /** @var Store $store */
        $store = $cart->store;
        $fulfillmentType = $data['fulfillment_type'];

        if (! $fulfillmentType->isAllowedBy($store->type)) {
            throw ValidationException::withMessages([
                'fulfillment_type' => "This store does not offer {$fulfillmentType->label()}.",
            ]);
        }

        $this->guardStockAvailable($cart);

        if ($fulfillmentType === FulfillmentType::Delivery) {
            $this->guardDeliveryWithinRadius($store, $data);
        }

        $subtotal = $this->pricing->subtotal($cart);

        if (! $this->pricing->meetsMinimumOrder($store, $subtotal)) {
            throw ValidationException::withMessages([
                'cart' => 'This order is below the store\'s minimum of ₱'.number_format((float) $store->min_order_amount, 2).'.',
            ]);
        }

        $paymentMethod = $data['payment_method'];
        $this->guardPaymentMethodAllowed($store, $paymentMethod);

        $deliveryFee = $this->pricing->deliveryFee($store, $fulfillmentType);
        $total = round($subtotal + $deliveryFee, 2);

        // Cash is collected on handover (unpaid); GCash is paid online first (pending
        // until the consumer submits a reference and the seller confirms receipt).
        $paymentStatus = $paymentMethod === PaymentMethod::Cash
            ? PaymentStatus::Unpaid
            : PaymentStatus::Pending;

        return DB::transaction(function () use ($user, $store, $cart, $data, $fulfillmentType, $paymentMethod, $paymentStatus, $subtotal, $deliveryFee, $total) {
            $order = Order::create([
                'reference' => Order::generateReference(),
                'user_id' => $user->id,
                'store_id' => $store->id,
                'status' => OrderStatus::Pending,
                'fulfillment_type' => $fulfillmentType,
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'delivery_address' => $fulfillmentType === FulfillmentType::Delivery ? ($data['delivery_address'] ?? null) : null,
                'delivery_latitude' => $fulfillmentType === FulfillmentType::Delivery ? ($data['delivery_latitude'] ?? null) : null,
                'delivery_longitude' => $fulfillmentType === FulfillmentType::Delivery ? ($data['delivery_longitude'] ?? null) : null,
                'contact_number' => $data['contact_number'],
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($cart->items as $item) {
                $product = $item->product;
                $order->items()->create([
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'unit' => $product->unit,
                    'unit_price' => $product->price,
                    'quantity' => $item->quantity,
                    'line_total' => round((float) $product->price * $item->quantity, 2),
                ]);
            }

            if ($paymentMethod === PaymentMethod::GCash) {
                $order->payments()->create([
                    'provider' => 'gcash_manual',
                    'amount' => $total,
                    'status' => 'pending',
                ]);
            }

            $cart->items()->delete();
            $cart->update(['store_id' => null]);

            return $order;
        });
    }

    /**
     * GCash requires the store to have online payment enabled with a GCash number set.
     */
    private function guardPaymentMethodAllowed(Store $store, PaymentMethod $method): void
    {
        if ($method !== PaymentMethod::GCash) {
            return;
        }

        if (! $store->accepts_online_payment || $store->gcash_number === null) {
            throw ValidationException::withMessages([
                'payment_method' => 'This store does not accept GCash payments.',
            ]);
        }
    }

    /**
     * Block checkout if any cart line is out of stock.
     */
    private function guardStockAvailable(Cart $cart): void
    {
        $unavailable = $cart->items
            ->filter(fn ($item) => $item->product->availability === ProductAvailability::OutOfStock)
            ->map(fn ($item) => $item->product->name)
            ->values();

        if ($unavailable->isNotEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'These items are out of stock: '.$unavailable->implode(', ').'.',
            ]);
        }
    }

    /**
     * Ensure the delivery pin sits within the store's service radius.
     *
     * @param  array{delivery_latitude?: float|null, delivery_longitude?: float|null}  $data
     */
    private function guardDeliveryWithinRadius(Store $store, array $data): void
    {
        $lat = $data['delivery_latitude'] ?? null;
        $lng = $data['delivery_longitude'] ?? null;

        if ($store->latitude === null || $store->longitude === null || $store->service_radius_km === null) {
            return;
        }

        if ($lat === null || $lng === null) {
            return;
        }

        $distance = $this->haversineKm(
            (float) $store->latitude,
            (float) $store->longitude,
            (float) $lat,
            (float) $lng,
        );

        if ($distance > (float) $store->service_radius_km) {
            throw ValidationException::withMessages([
                'delivery_latitude' => 'Your delivery location is outside this store\'s delivery range.',
            ]);
        }
    }

    /**
     * Great-circle distance in kilometres (portable — works on SQLite and MySQL).
     */
    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * asin(min(1.0, sqrt($a)));
    }
}
