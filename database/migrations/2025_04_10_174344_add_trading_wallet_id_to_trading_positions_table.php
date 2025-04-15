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
        Schema::table('trading_positions', function (Blueprint $table) {
            $table->uuid('trading_wallet_id')->nullable()->after('user_id');
            $table->foreign('trading_wallet_id')->references('id')->on('trading_wallets')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trading_positions', function (Blueprint $table) {
            $table->dropForeign(['trading_wallet_id']);
            $table->dropColumn('trading_wallet_id');
        });
    }
};
