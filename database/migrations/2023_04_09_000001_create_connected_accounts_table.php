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
        Schema::create('connected_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('institution_id');
            $table->string('institution_name');
            $table->string('account_id');
            $table->string('account_name');
            $table->string('account_type');
            $table->string('account_subtype')->nullable();
            $table->string('mask')->nullable();
            $table->decimal('available_balance', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->string('iso_currency_code')->default('USD');
            $table->string('status')->default('ACTIVE');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_default')->default(false);
            $table->text('plaid_access_token')->nullable();
            $table->string('plaid_item_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            // Indexes for faster queries
            $table->index('user_id');
            $table->index('institution_id');
            $table->index('account_id');
            $table->index('is_default');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('connected_accounts');
    }
};
