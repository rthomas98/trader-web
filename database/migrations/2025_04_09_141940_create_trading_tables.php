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
        // Wallets table
        if (!Schema::hasTable('wallets')) {
            Schema::create('wallets', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('currency');
                $table->enum('currency_type', ['FIAT', 'CRYPTO']);
                $table->decimal('balance', 18, 8)->default(0);
                $table->decimal('available_balance', 18, 8)->default(0);
                $table->decimal('locked_balance', 18, 8)->default(0);
                $table->boolean('is_default')->default(false);
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('user_id');
                $table->index('currency');
                $table->index('currency_type');
                $table->index('is_default');
            });
        }

        // Wallet transactions table
        if (!Schema::hasTable('wallet_transactions')) {
            Schema::create('wallet_transactions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('wallet_id');
                $table->foreign('wallet_id')->references('id')->on('wallets')->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->enum('transaction_type', ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'TRADE', 'FEE', 'INTEREST', 'REFERRAL', 'BONUS', 'LOCK', 'UNLOCK']);
                $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'])->default('PENDING');
                $table->decimal('amount', 18, 8);
                $table->decimal('fee', 18, 8)->default(0);
                $table->text('description')->nullable();
                $table->json('metadata')->nullable();
                $table->string('reference_id')->nullable();
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('wallet_id');
                $table->index('user_id');
                $table->index('transaction_type');
                $table->index('status');
                $table->index('reference_id');
            });
        }

        // Connected accounts table
        if (!Schema::hasTable('connected_accounts')) {
            Schema::create('connected_accounts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('institution_id');
                $table->string('institution_name');
                $table->string('account_id');
                $table->string('account_name');
                $table->string('account_type');
                $table->string('account_subtype');
                $table->string('mask');
                $table->decimal('available_balance', 18, 8)->nullable();
                $table->decimal('current_balance', 18, 8)->nullable();
                $table->string('iso_currency_code');
                $table->enum('status', ['ACTIVE', 'INACTIVE', 'PENDING'])->default('PENDING');
                $table->boolean('is_verified')->default(false);
                $table->boolean('is_default')->default(false);
                $table->string('plaid_access_token')->nullable();
                $table->string('plaid_item_id')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('user_id');
                $table->index('institution_id');
                $table->index('account_id');
                $table->index('status');
                $table->index('is_verified');
                $table->index('is_default');
            });
        }

        // Funding transactions table
        if (!Schema::hasTable('funding_transactions')) {
            Schema::create('funding_transactions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->uuid('connected_account_id')->nullable();
                $table->foreign('connected_account_id')->references('id')->on('connected_accounts')->onDelete('set null');
                $table->enum('transaction_type', ['DEPOSIT', 'WITHDRAWAL']);
                $table->decimal('amount', 18, 2);
                $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'])->default('PENDING');
                $table->string('reference_id')->nullable();
                $table->text('notes')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('user_id');
                $table->index('connected_account_id');
                $table->index('transaction_type');
                $table->index('status');
            });
        }

        // Portfolio positions table
        if (!Schema::hasTable('portfolio_positions')) {
            Schema::create('portfolio_positions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('symbol');
                $table->decimal('quantity', 18, 8);
                $table->decimal('entry_price', 18, 2);
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('user_id');
                $table->index('symbol');
            });
        }

        // Market news table
        if (!Schema::hasTable('market_news')) {
            Schema::create('market_news', function (Blueprint $table) {
                $table->string('url')->primary();
                $table->string('headline');
                $table->text('summary');
                $table->timestamp('published_at');
                $table->string('source')->nullable();
                $table->enum('category', ['market', 'company', 'economy']);
                $table->json('topics')->default('[]');
                $table->enum('sentiment', ['positive', 'negative', 'neutral'])->nullable();
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('published_at');
                $table->index('category');
                $table->index('sentiment');
            });
        }

        // Economic calendar table
        if (!Schema::hasTable('economic_calendar')) {
            Schema::create('economic_calendar', function (Blueprint $table) {
                $table->string('event_id')->primary();
                $table->string('title');
                $table->string('country');
                $table->date('event_date');
                $table->string('event_time')->nullable();
                $table->enum('impact', ['high', 'medium', 'low']);
                $table->string('forecast')->nullable();
                $table->string('previous')->nullable();
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('event_date');
                $table->index('country');
                $table->index('impact');
            });
        }

        // Trading orders table
        if (!Schema::hasTable('trading_orders')) {
            Schema::create('trading_orders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('currency_pair');
                $table->enum('order_type', ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']);
                $table->enum('side', ['BUY', 'SELL']);
                $table->decimal('quantity', 18, 8);
                $table->decimal('price', 18, 8)->nullable();
                $table->decimal('stop_loss', 18, 8)->nullable();
                $table->decimal('take_profit', 18, 8)->nullable();
                $table->enum('time_in_force', ['GTC', 'IOC', 'FOK', 'DAY']);
                $table->enum('status', ['PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']);
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('user_id');
                $table->index('currency_pair');
                $table->index('order_type');
                $table->index('side');
                $table->index('status');
            });
        }

        // Trading positions table
        if (!Schema::hasTable('trading_positions')) {
            Schema::create('trading_positions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('currency_pair');
                $table->enum('trade_type', ['BUY', 'SELL']);
                $table->decimal('entry_price', 18, 8);
                $table->decimal('stop_loss', 18, 8)->nullable();
                $table->decimal('take_profit', 18, 8)->nullable();
                $table->enum('status', ['OPEN', 'CLOSED', 'STOPPED']);
                $table->timestamp('entry_time');
                $table->timestamp('exit_time')->nullable();
                $table->decimal('exit_price', 18, 8)->nullable();
                $table->decimal('profit_loss', 18, 8)->nullable();
                $table->decimal('quantity', 18, 8);
                $table->timestamps();
                
                // Indexes for faster queries
                $table->index('user_id');
                $table->index('currency_pair');
                $table->index('trade_type');
                $table->index('status');
            });
        }

        // Add financial columns to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'account_balance')) {
                $table->decimal('account_balance', 15, 2)->default(10000.00);
            }
            if (!Schema::hasColumn('users', 'available_margin')) {
                $table->decimal('available_margin', 15, 2)->default(10000.00);
            }
            if (!Schema::hasColumn('users', 'leverage')) {
                $table->integer('leverage')->default(50);
            }
            if (!Schema::hasColumn('users', 'risk_percentage')) {
                $table->decimal('risk_percentage', 5, 2)->default(2.00);
            }
            if (!Schema::hasColumn('users', 'onboarding_completed')) {
                $table->boolean('onboarding_completed')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'account_balance')) {
                $table->dropColumn('account_balance');
            }
            if (Schema::hasColumn('users', 'available_margin')) {
                $table->dropColumn('available_margin');
            }
            if (Schema::hasColumn('users', 'leverage')) {
                $table->dropColumn('leverage');
            }
            if (Schema::hasColumn('users', 'risk_percentage')) {
                $table->dropColumn('risk_percentage');
            }
            if (Schema::hasColumn('users', 'onboarding_completed')) {
                $table->dropColumn('onboarding_completed');
            }
        });
        
        Schema::dropIfExists('trading_positions');
        Schema::dropIfExists('trading_orders');
        Schema::dropIfExists('economic_calendar');
        Schema::dropIfExists('market_news');
        Schema::dropIfExists('portfolio_positions');
        Schema::dropIfExists('funding_transactions');
        Schema::dropIfExists('connected_accounts');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
