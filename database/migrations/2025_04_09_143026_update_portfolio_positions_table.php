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
        Schema::table('portfolio_positions', function (Blueprint $table) {
            // Rename entry_price to average_price
            $table->renameColumn('entry_price', 'average_price');
            
            // Add new columns
            $table->string('name', 100)->nullable()->after('symbol');
            $table->string('category', 50)->nullable()->after('average_price');
            $table->text('notes')->nullable()->after('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('portfolio_positions', function (Blueprint $table) {
            // Rename average_price back to entry_price
            $table->renameColumn('average_price', 'entry_price');
            
            // Drop new columns
            $table->dropColumn(['name', 'category', 'notes']);
        });
    }
};
