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
        Schema::table('trading_wallets', function (Blueprint $table) {
            $table->decimal('equity', 20, 8)->default(0)->after('used_margin');
            $table->decimal('margin_call_level', 5, 2)->default(80.00)->after('leverage');
            $table->decimal('margin_stop_out_level', 5, 2)->default(50.00)->after('margin_call_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trading_wallets', function (Blueprint $table) {
            $table->dropColumn(['equity', 'margin_call_level', 'margin_stop_out_level']);
        });
    }
};
