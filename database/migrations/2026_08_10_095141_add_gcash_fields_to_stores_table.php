<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->string('gcash_number')->nullable()->after('accepts_online_payment');
            $table->string('gcash_qr_path')->nullable()->after('gcash_number');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['gcash_number', 'gcash_qr_path']);
        });
    }
};
