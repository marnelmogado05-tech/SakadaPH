<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'suspended'])
                ->default('pending')
                ->change();
            $table->enum('type', ['pickup', 'delivery', 'both'])->default('pickup')->after('status');
            $table->decimal('latitude', 10, 7)->nullable()->after('type');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('service_radius_km', 8, 2)->nullable()->after('longitude');
            $table->json('operating_hours')->nullable()->after('service_radius_km');
            $table->string('logo_path')->nullable()->after('operating_hours');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['type', 'latitude', 'longitude', 'service_radius_km', 'operating_hours', 'logo_path']);
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])
                ->default('pending')
                ->change();
        });
    }
};
