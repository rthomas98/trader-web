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
        Schema::create('copy_trading_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('copier_user_id')->constrained('users')->onDelete('cascade'); // User doing the copying
            $table->foreignId('trader_user_id')->constrained('users')->onDelete('cascade'); // User being copied
            $table->enum('status', ['active', 'paused', 'stopped'])->default('active');
            $table->decimal('risk_allocation_percentage', 5, 2)->default(100.00); // % of copier's capital to use relative to trader
            $table->decimal('max_drawdown_percentage', 5, 2)->nullable(); // Stop copying if copier's loss on this relationship exceeds %
            $table->boolean('copy_fixed_size')->default(false); // True = use fixed_lot_size, False = use proportional size based on risk_allocation_percentage
            $table->decimal('fixed_lot_size', 10, 2)->nullable(); // e.g., 0.1 lots per trade, only if copy_fixed_size is true
            $table->boolean('copy_stop_loss')->default(true);
            $table->boolean('copy_take_profit')->default(true);
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('stopped_at')->nullable();
            $table->timestamps();

            // Ensure a user can only copy a specific trader once actively
            $table->unique(['copier_user_id', 'trader_user_id', 'status'], 'copier_trader_status_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('copy_trading_relationships');
    }
};
