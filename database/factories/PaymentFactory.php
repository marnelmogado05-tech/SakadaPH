<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory()->online(),
            'provider' => 'paymongo',
            'provider_reference' => 'cs_'.fake()->uuid(),
            'amount' => fake()->randomFloat(2, 50, 1000),
            'status' => 'pending',
            'raw_payload' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(['status' => 'paid']);
    }

    public function failed(): static
    {
        return $this->state(['status' => 'failed']);
    }
}
