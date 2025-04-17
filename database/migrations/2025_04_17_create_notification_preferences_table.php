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
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Price and Market Notifications
            $table->boolean('price_alerts')->default(true);
            $table->boolean('market_news')->default(true);
            
            // Trade Notifications
            $table->boolean('trade_executed')->default(true);
            $table->boolean('trade_closed')->default(true);
            $table->boolean('stop_loss_hit')->default(true);
            $table->boolean('take_profit_hit')->default(true);
            
            // Copy Trading Notifications
            $table->boolean('new_copier')->default(true);
            $table->boolean('copier_stopped')->default(true);
            $table->boolean('copy_request_received')->default(true);
            $table->boolean('copy_request_approved')->default(true);
            $table->boolean('copy_request_rejected')->default(true);
            
            // Performance Notifications
            $table->boolean('profit_milestone')->default(true);
            $table->boolean('loss_milestone')->default(true);
            $table->boolean('win_streak')->default(true);
            $table->boolean('drawdown_alert')->default(true);
            
            // Social Notifications
            $table->boolean('new_follower')->default(true);
            $table->boolean('trader_new_trade')->default(true);
            $table->boolean('trader_performance_update')->default(true);
            
            // Delivery Preferences
            $table->boolean('email_notifications')->default(true);
            $table->boolean('push_notifications')->default(true);
            $table->boolean('in_app_notifications')->default(true);
            
            $table->timestamps();
            
            // Ensure one preferences record per user
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
