<?php

namespace Database\Seeders;

use App\Enums\ProductAvailability;
use App\Enums\StoreType;
use App\Enums\UserRole;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@sakada.ph',
        ]);

        $seller = User::factory()->seller()->create([
            'first_name' => 'Test',
            'last_name' => 'Seller',
            'email' => 'seller@sakada.ph',
        ]);

        $store = Store::factory()->approved()->for($seller)->create([
            'name' => 'Sakada Sample Water Station',
            'description' => 'Clean, affordable purified and mineral water for pickup or delivery.',
            'address' => '123 Rizal St, Barangay Poblacion, Manila',
            'contact_number' => '09181234567',
            'type' => StoreType::Both,
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'service_radius_km' => 10,
            'delivery_fee' => 25,
            'min_order_amount' => null,
            'accepts_online_payment' => true,
            'gcash_number' => '09171234567',
        ]);

        Product::factory()->for($store)->create([
            'name' => '5-Gallon Purified Water Refill',
            'description' => 'Round-trip refill for a standard 5-gallon container.',
            'price' => 30,
            'unit' => 'container',
            'quantity' => 100,
            'availability' => ProductAvailability::InStock,
        ]);

        Product::factory()->for($store)->create([
            'name' => '500ml Mineral Water (Case of 24)',
            'description' => 'Sealed bottled mineral water, sold by the case.',
            'price' => 180,
            'unit' => 'case',
            'quantity' => 40,
            'availability' => ProductAvailability::InStock,
        ]);

        User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'Consumer',
            'email' => 'user@sakada.ph',
            'role' => UserRole::User,
        ]);
    }
}
