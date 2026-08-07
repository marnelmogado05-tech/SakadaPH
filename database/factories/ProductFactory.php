<?php

namespace Database\Factories;

use App\Enums\ProductAvailability;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    private static array $units = ['gallon', 'liter', 'container', 'bottle'];

    public function definition(): array
    {
        return [
            'store_id' => Store::factory()->approved(),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'price' => fake()->randomFloat(2, 5, 500),
            'unit' => fake()->randomElement(self::$units),
            'quantity' => fake()->numberBetween(1, 100),
            'availability' => ProductAvailability::InStock,
            'last_updated_at' => now(),
        ];
    }

    public function inStock(): static
    {
        return $this->state(['availability' => ProductAvailability::InStock]);
    }

    public function lowStock(): static
    {
        return $this->state(['availability' => ProductAvailability::LowStock]);
    }

    public function outOfStock(): static
    {
        return $this->state([
            'availability' => ProductAvailability::OutOfStock,
            'quantity' => 0,
        ]);
    }

    /** @deprecated use outOfStock() */
    public function unavailable(): static
    {
        return $this->outOfStock();
    }
}
