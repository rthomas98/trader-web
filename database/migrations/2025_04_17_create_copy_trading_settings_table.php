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
        Schema::create('copy_trading_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('privacy_level', ['public', 'followers_only', 'approved_only', 'private'])->default('public');
            $table->boolean('auto_approve_followers')->default(true);
            $table->boolean('notify_on_copy_request')->default(true);
            $table->text('copy_trading_bio')->nullable();
            $table->timestamps();
            
            // Ensure one settings record per user
            $table->unique('user_id');
        });
        
        // Add a column to copy_trading_relationships for request status
        Schema::table('copy_trading_relationships', function (Blueprint $table) {
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('approved')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('copy_trading_relationships', function (Blueprint $table) {
            $table->dropColumn('approval_status');
        });
        
        Schema::dropIfExists('copy_trading_settings');
    }
};
