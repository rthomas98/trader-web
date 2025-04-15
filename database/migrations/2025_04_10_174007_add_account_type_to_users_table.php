<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('trading_account_type', ['DEMO', 'LIVE'])->default('DEMO')->after('email');
            $table->boolean('demo_mode_enabled')->default(true)->after('trading_account_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['trading_account_type', 'demo_mode_enabled']);
        });
    }
};
