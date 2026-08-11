<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    public function definition(): array
    {
        $unitPrice = fake()->randomFloat(2, 5, 500);
        $quantity = fake()->numberBetween(1, 10);

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'name' => fake()->words(3, true),
            'unit' => fake()->randomElement(['gallon', 'liter', 'container', 'bottle']),
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'line_total' => round($unitPrice * $quantity, 2),
        ];
    }
}
