<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->enum('availability', ['in_stock', 'low_stock', 'out_of_stock'])
                ->default('in_stock')
                ->after('quantity');
            $table->timestamp('last_updated_at')->nullable()->after('availability');
        });

        // Migrate existing boolean data before dropping the column
        DB::statement(
            "UPDATE products SET availability = CASE WHEN is_available = 1 THEN 'in_stock' ELSE 'out_of_stock' END"
        );

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_available');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_available')->default(true)->after('quantity');
        });

        DB::statement(
            "UPDATE products SET is_available = CASE WHEN availability = 'out_of_stock' THEN 0 ELSE 1 END"
        );

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['availability', 'last_updated_at']);
        });
    }
};
