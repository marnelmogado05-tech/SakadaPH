<?php

namespace Database\Factories;

use App\Enums\FulfillmentType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 50, 1000);

        return [
            'reference' => Order::generateReference(),
            'user_id' => User::factory(),
            'store_id' => Store::factory()->approved(),
            'status' => OrderStatus::Pending,
            'fulfillment_type' => FulfillmentType::Pickup,
            'payment_method' => PaymentMethod::Cash,
            'payment_status' => PaymentStatus::Unpaid,
            'subtotal' => $subtotal,
            'delivery_fee' => 0,
            'total' => $subtotal,
            'delivery_address' => null,
            'delivery_latitude' => null,
            'delivery_longitude' => null,
            'contact_number' => '09'.fake()->numerify('#########'),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function delivery(): static
    {
        return $this->state(function (array $attributes) {
            $deliveryFee = 50;

            return [
                'fulfillment_type' => FulfillmentType::Delivery,
                'delivery_fee' => $deliveryFee,
                'total' => (float) $attributes['subtotal'] + $deliveryFee,
                'delivery_address' => fake()->address(),
                'delivery_latitude' => fake()->latitude(),
                'delivery_longitude' => fake()->longitude(),
            ];
        });
    }

    public function online(): static
    {
        return $this->state([
            'payment_method' => PaymentMethod::GCash,
            'payment_status' => PaymentStatus::Pending,
            'status' => OrderStatus::PendingPayment,
        ]);
    }

    public function paid(): static
    {
        return $this->state([
            'payment_status' => PaymentStatus::Paid,
        ]);
    }

    public function confirmed(): static
    {
        return $this->state([
            'status' => OrderStatus::Confirmed,
            'confirmed_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state([
            'status' => OrderStatus::Completed,
            'payment_status' => PaymentStatus::Paid,
            'confirmed_at' => now(),
            'completed_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status' => OrderStatus::Cancelled,
            'cancellation_reason' => fake()->sentence(),
            'cancelled_at' => now(),
        ]);
    }
}
