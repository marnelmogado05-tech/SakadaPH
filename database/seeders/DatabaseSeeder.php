<?php

namespace Database\Seeders;

use App\Enums\UserRole;
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

        User::factory()->seller()->create([
            'first_name' => 'Test',
            'last_name' => 'Seller',
            'email' => 'seller@sakada.ph',
        ]);

        User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'Consumer',
            'email' => 'user@sakada.ph',
            'role' => UserRole::User,
        ]);
    }
}
