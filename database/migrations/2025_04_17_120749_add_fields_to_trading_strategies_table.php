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
        Schema::table('trading_strategies', function (Blueprint $table) {
            $table->string('type')->nullable()->after('description'); // e.g., Scalping, Swing, Day Trading
            $table->string('risk_level')->nullable()->after('type'); // e.g., Low, Medium, High
            $table->text('target_assets')->nullable()->after('risk_level'); // e.g., EUR/USD, BTC/USD, Stocks
            $table->string('timeframe')->nullable()->after('target_assets'); // e.g., M1, M5, H1, D1
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trading_strategies', function (Blueprint $table) {
            $table->dropColumn(['type', 'risk_level', 'target_assets', 'timeframe']);
        });
    }
};
