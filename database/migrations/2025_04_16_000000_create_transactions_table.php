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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->uuid('wallet_id');
            $table->foreign('wallet_id')->references('id')->on('trading_wallets')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->string('type')->comment('deposit, withdrawal, trade, etc.');
            $table->string('status')->default('completed');
            $table->string('description')->nullable();
            $table->string('reference')->nullable()->comment('Transaction reference number');
            $table->json('metadata')->nullable()->comment('Additional transaction data');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
