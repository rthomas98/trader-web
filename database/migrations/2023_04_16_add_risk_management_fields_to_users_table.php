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
            // Add risk management fields if they don't exist
            if (!Schema::hasColumn('users', 'max_drawdown_percentage')) {
                $table->decimal('max_drawdown_percentage', 8, 2)->default(20.00)->after('risk_percentage');
            }
            
            if (!Schema::hasColumn('users', 'risk_tolerance_level')) {
                $table->string('risk_tolerance_level')->default('moderate')->after('max_drawdown_percentage');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove the columns if they exist
            if (Schema::hasColumn('users', 'max_drawdown_percentage')) {
                $table->dropColumn('max_drawdown_percentage');
            }
            
            if (Schema::hasColumn('users', 'risk_tolerance_level')) {
                $table->dropColumn('risk_tolerance_level');
            }
        });
    }
};
