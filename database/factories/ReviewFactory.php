<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory()->completed(),
            'user_id' => fn (array $attributes) => Order::find($attributes['order_id'])->user_id,
            'store_id' => fn (array $attributes) => Order::find($attributes['order_id'])->store_id,
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->optional()->sentence(),
        ];
    }
}
