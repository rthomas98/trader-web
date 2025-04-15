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
        Schema::create('trading_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('wallet_type', ['DEMO', 'LIVE'])->default('DEMO');
            $table->decimal('balance', 20, 8)->default(0);
            $table->decimal('available_margin', 20, 8)->default(0);
            $table->decimal('used_margin', 20, 8)->default(0);
            $table->integer('leverage')->default(10);
            $table->decimal('risk_percentage', 5, 2)->default(2.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Unique constraint to ensure a user has only one wallet of each type
            $table->unique(['user_id', 'wallet_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trading_wallets');
    }
};
