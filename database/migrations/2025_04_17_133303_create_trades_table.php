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
        Schema::create('trades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('symbol'); // Currency pair or instrument
            $table->enum('type', ['BUY', 'SELL']);
            $table->decimal('entry_price', 10, 5);
            $table->decimal('exit_price', 10, 5);
            $table->decimal('lot_size', 10, 2);
            $table->decimal('profit', 10, 2);
            $table->decimal('stop_loss', 10, 5)->nullable();
            $table->decimal('take_profit', 10, 5)->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('copied_from_trade_id')->nullable()->references('id')->on('trades')->onDelete('set null');
            $table->foreignId('copy_trading_relationship_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
            
            // Indexes for faster queries
            $table->index('user_id');
            $table->index('symbol');
            $table->index('type');
            $table->index('profit');
            $table->index('opened_at');
            $table->index('closed_at');
            $table->index('copied_from_trade_id');
            $table->index('copy_trading_relationship_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trades');
    }
};
