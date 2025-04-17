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
        Schema::create('trading_journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('entry_type', ['idea', 'strategy', 'analysis', 'review']);
            $table->enum('market_condition', ['bullish', 'bearish', 'neutral', 'volatile', 'ranging'])->nullable();
            $table->string('currency_pair')->nullable();
            $table->string('timeframe')->nullable();
            $table->decimal('entry_price', 15, 5)->nullable();
            $table->decimal('stop_loss', 15, 5)->nullable();
            $table->decimal('take_profit', 15, 5)->nullable();
            $table->decimal('risk_reward_ratio', 8, 2)->nullable();
            $table->decimal('position_size', 15, 5)->nullable();
            $table->decimal('risk_percentage', 8, 2)->nullable();
            $table->text('setup_notes')->nullable();
            $table->text('entry_reason')->nullable();
            $table->text('exit_reason')->nullable();
            $table->text('lessons_learned')->nullable();
            $table->json('indicators_used')->nullable();
            $table->json('screenshots')->nullable(); // Store image paths
            $table->uuid('related_trade_id')->nullable();
            $table->foreign('related_trade_id')->references('id')->on('trading_positions')->onDelete('set null');
            $table->enum('trade_outcome', ['win', 'loss', 'breakeven', 'pending'])->nullable();
            $table->decimal('profit_loss', 15, 2)->nullable();
            $table->decimal('profit_loss_percentage', 8, 2)->nullable();
            $table->enum('emotional_state', ['confident', 'fearful', 'greedy', 'patient', 'impulsive', 'calm', 'stressed'])->nullable();
            $table->integer('trade_rating')->nullable(); // 1-5 rating
            $table->boolean('followed_plan')->default(true);
            $table->boolean('is_favorite')->default(false);
            $table->json('tags')->nullable();
            $table->timestamp('trade_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trading_journals');
    }
};
