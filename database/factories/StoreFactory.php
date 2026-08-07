<?php

namespace Database\Factories;

use App\Enums\SellerStatus;
use App\Enums\StoreType;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Store>
 */
class StoreFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->seller(),
            'name' => fake()->company(),
            'description' => fake()->sentence(),
            'address' => fake()->address(),
            'contact_number' => '09'.fake()->numerify('#########'),
            'status' => SellerStatus::Pending,
            'type' => fake()->randomElement(StoreType::cases()),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => SellerStatus::Pending]);
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => SellerStatus::Approved,
            'approved_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => SellerStatus::Rejected,
            'rejected_at' => now(),
            'rejection_reason' => fake()->sentence(),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn () => [
            'status' => SellerStatus::Suspended,
            'rejection_reason' => fake()->sentence(),
        ]);
    }
}
