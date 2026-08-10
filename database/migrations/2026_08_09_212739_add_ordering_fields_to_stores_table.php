<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->decimal('delivery_fee', 10, 2)->nullable()->after('service_radius_km');
            $table->decimal('min_order_amount', 10, 2)->nullable()->after('delivery_fee');
            $table->boolean('accepts_online_payment')->default(false)->after('min_order_amount');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['delivery_fee', 'min_order_amount', 'accepts_online_payment']);
        });
    }
};
