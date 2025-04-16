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
            $table->timestamp('closed_at')->nullable()->after('close_date'); // Add the closed_at column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trading_positions', function (Blueprint $table) {
            $table->dropColumn('closed_at'); // Drop the column on rollback
        });
    }
};
