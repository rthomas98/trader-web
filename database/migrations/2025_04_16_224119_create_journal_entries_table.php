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
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Assuming Journal Entries belong to a User
            $table->string('pair'); // e.g., EUR/USD
            $table->enum('direction', ['long', 'short']);
            $table->decimal('entry_price', 10, 5);
            $table->decimal('exit_price', 10, 5)->nullable();
            $table->decimal('stop_loss', 10, 5)->nullable();
            $table->decimal('take_profit', 10, 5)->nullable();
            $table->decimal('risk_reward_ratio', 8, 2)->nullable();
            $table->decimal('profit_loss', 10, 2)->nullable();
            $table->enum('outcome', ['win', 'loss', 'breakeven'])->nullable();
            $table->timestamp('entry_at');
            $table->timestamp('exit_at')->nullable();
            $table->text('setup_reason')->nullable(); // Reason for entering the trade
            $table->text('execution_notes')->nullable(); // Notes on how the trade was managed
            $table->text('post_trade_analysis')->nullable(); // Reflection after the trade
            $table->string('image_before')->nullable(); // Path to screenshot before entry
            $table->string('image_after')->nullable(); // Path to screenshot after exit
            $table->json('tags')->nullable(); // For categorization
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
