<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cart>
 */
class CartFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'store_id' => Store::factory()->approved(),
        ];
    }

    public function empty(): static
    {
        return $this->state(['store_id' => null]);
    }
}
