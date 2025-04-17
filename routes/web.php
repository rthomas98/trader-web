<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ConnectedAccountController;
use App\Http\Controllers\CopyTradingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FundingController;
use App\Http\Controllers\JournalCommentController;
use App\Http\Controllers\JournalEntryController;
use App\Http\Controllers\MarketDataController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RiskManagementController;
use App\Http\Controllers\SocialController;
use App\Http\Controllers\StrategyBacktestingController;
use App\Http\Controllers\TradingController;
use App\Http\Controllers\TradingJournalController;
use App\Http\Controllers\TradingStrategyController;
use App\Http\Controllers\WalletController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Onboarding routes - accessible to authenticated users without requiring onboarding completion
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'index'])->name('onboarding.index');
    Route::post('onboarding/link-token', [OnboardingController::class, 'createLinkToken'])->name('onboarding.link-token');
    Route::post('onboarding/exchange-token', [OnboardingController::class, 'exchangeToken'])->name('onboarding.exchange-token');
    Route::post('onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
    Route::post('onboarding/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');
    Route::post('onboarding/deposit', [OnboardingController::class, 'deposit'])->name('onboarding.deposit');
    
    // Funding route for onboarding
    Route::post('funding/deposit', [FundingController::class, 'deposit'])->name('funding.deposit');
    
    // Simple deposit route for onboarding
    Route::post('funding/simple-deposit', [FundingController::class, 'simpleDeposit'])->name('funding.simple-deposit');
});

// Main application routes - require onboarding completion
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class])->group(function () {
    // Dashboard route
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Analytics route
    Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Risk Management routes
    Route::get('/risk-management', [RiskManagementController::class, 'index'])
        ->middleware(['auth', 'verified'])
        ->name('risk-management');
        
    Route::post('/risk-management/update-settings', [RiskManagementController::class, 'updateRiskSettings'])
        ->middleware(['auth', 'verified'])
        ->name('risk-management.update-settings');
        
    Route::post('/api/risk-management/calculate-position-size', [RiskManagementController::class, 'calculatePositionSize'])
        ->middleware(['auth', 'verified'])
        ->name('risk-management.calculate-position-size');

    // Trading Journal routes
    Route::prefix('trading-journal')->middleware(['auth', 'verified'])->group(function () {
        Route::get('/', [TradingJournalController::class, 'index'])->name('trading-journal.index');
        Route::get('/create', [TradingJournalController::class, 'create'])->name('trading-journal.create');
        Route::post('/', [TradingJournalController::class, 'store'])->name('trading-journal.store');
        Route::get('/{id}', [TradingJournalController::class, 'show'])->name('trading-journal.show');
        Route::get('/{id}/edit', [TradingJournalController::class, 'edit'])->name('trading-journal.edit');
        Route::put('/{id}', [TradingJournalController::class, 'update'])->name('trading-journal.update');
        Route::post('/{id}/delete', [TradingJournalController::class, 'destroy'])->name('trading-journal.destroy');
        Route::post('/{id}/favorite', [TradingJournalController::class, 'toggleFavorite'])->name('trading-journal.favorite');
        
        // Journal Comment routes
        Route::post('/{journalId}/comments', [JournalCommentController::class, 'store'])->name('journal-comments.store');
        Route::put('/{journalId}/comments/{commentId}', [JournalCommentController::class, 'update'])->name('journal-comments.update');
        Route::post('/{journalId}/comments/{commentId}/delete', [JournalCommentController::class, 'destroy'])->name('journal-comments.destroy');
    });
        
    // Wallet routes
    Route::resource('wallets', WalletController::class);
    Route::post('wallets/{id}/deposit', [WalletController::class, 'deposit'])->name('wallets.deposit');
    Route::post('wallets/{id}/withdraw', [WalletController::class, 'withdraw'])->name('wallets.withdraw');

    // Trading routes
    Route::middleware(['auth'])->prefix('trading')->name('trading.')->group(function () {
        Route::get('/', [TradingController::class, 'index'])->name('index');
        Route::get('/historical-data', [TradingController::class, 'getHistoricalData'])->name('historical-data');
        Route::get('/predictive-data', [TradingController::class, 'getPredictiveData'])->name('predictive-data');
        Route::get('/chart-data', [TradingController::class, 'getChartData'])->name('chart-data');
        Route::post('/positions', [TradingController::class, 'storePosition'])->name('positions.store');
        Route::post('/positions/{position}/close', [TradingController::class, 'closePosition'])->name('positions.close');
        Route::get('/history', [TradingController::class, 'history'])->name('history'); // Add Trade History route
        Route::post('/toggle-mode', [TradingController::class, 'toggleTradingMode'])->name('toggle-mode');
        Route::post('/orders', [TradingController::class, 'storeOrder'])->name('orders.store');
    });

    // Portfolio routes
    Route::resource('portfolio', PortfolioController::class);
    Route::post('portfolio/import', [PortfolioController::class, 'import'])->name('portfolio.import');
    Route::get('portfolio/export', [PortfolioController::class, 'export'])->name('portfolio.export');

    // Connected Account routes
    Route::resource('connected-accounts', ConnectedAccountController::class);
    Route::post('connected-accounts/{id}/verify', [ConnectedAccountController::class, 'verify'])->name('connected-accounts.verify');
    Route::post('connected-accounts/{id}/refresh', [ConnectedAccountController::class, 'refresh'])->name('connected-accounts.refresh');

    // Funding routes
    Route::get('funding', [FundingController::class, 'index'])->name('funding.index');
    Route::get('funding/deposit/create', [FundingController::class, 'createDeposit'])->name('funding.deposit.create');
    Route::post('funding/deposit', [FundingController::class, 'storeDeposit'])->name('funding.deposit.store');
    Route::get('funding/withdrawal/create', [FundingController::class, 'createWithdrawal'])->name('funding.withdrawal.create');
    Route::post('funding/withdrawal', [FundingController::class, 'storeWithdrawal'])->name('funding.withdrawal.store');
    Route::get('funding/{id}', [FundingController::class, 'show'])->name('funding.show');
    Route::post('funding/{id}/cancel', [FundingController::class, 'cancel'])->name('funding.cancel');
    Route::post('funding/{id}/process', [FundingController::class, 'process'])->name('funding.process');

    // Market Data routes
    Route::get('market-data', [MarketDataController::class, 'index'])->name('market-data.index');
    Route::get('market-data/news', [MarketDataController::class, 'news'])->name('market-data.news');
    Route::get('market-data/calendar', [MarketDataController::class, 'calendar'])->name('market-data.calendar');
    Route::get('market-data/symbol/{symbol}', [MarketDataController::class, 'symbol'])->name('market-data.symbol');

    // Journal Entry routes
    Route::resource('journal-entries', JournalEntryController::class);

    // Strategy Backtesting
    Route::get('/strategy-backtesting', [StrategyBacktestingController::class, 'index'])->name('strategy-backtesting.index');
    Route::post('/strategy-backtesting/run', [StrategyBacktestingController::class, 'runBacktest'])->name('strategy-backtesting.run');

    // Social Trading routes
    Route::prefix('social')->name('social.')->group(function () {
        Route::get('/', [SocialController::class, 'index'])->name('index');
        Route::get('/followers', [SocialController::class, 'followers'])->name('followers');
        Route::get('/following', [SocialController::class, 'following'])->name('following');
        Route::get('/trader/{user}', [SocialController::class, 'showTrader'])->name('trader');
        Route::post('/follow/{user}', [SocialController::class, 'follow'])->name('follow');
        Route::delete('/unfollow/{user}', [SocialController::class, 'unfollow'])->name('unfollow');
        Route::get('/search', [SocialController::class, 'search'])->name('search');
        Route::get('/popular', [SocialController::class, 'popularTraders'])->name('popular');
    });

    // Trading Strategies Management
    Route::prefix('my-strategies')->name('my-strategies.')->group(function () {
        Route::get('/', [TradingStrategyController::class, 'index'])->name('index');
        Route::post('/', [TradingStrategyController::class, 'store'])->name('store');
        Route::put('/{strategy}', [TradingStrategyController::class, 'update'])->name('update');
        Route::post('/{strategy}/delete', [TradingStrategyController::class, 'destroy'])->name('destroy');
    });

    // Copy Trading Management
    Route::middleware(['auth'])->group(function () {
        Route::get('/copy-trading', [CopyTradingController::class, 'index'])->name('copy-trading.index');
        Route::post('/copy-trading', [CopyTradingController::class, 'store'])->name('copy-trading.store');
        Route::put('/copy-trading/{relationship}', [CopyTradingController::class, 'update'])->name('copy-trading.update');
        Route::post('/copy-trading/{relationship}/delete', [CopyTradingController::class, 'destroy'])->name('copy-trading.destroy');
        Route::post('/copy-trading/{relationship}/reactivate', [CopyTradingController::class, 'reactivate'])->name('copy-trading.reactivate');
        Route::get('/copy-trading/{relationship}/performance', [CopyTradingController::class, 'performance'])->name('copy-trading.performance');
        
        // Copy Trading Settings
        Route::get('/copy-trading/settings', [CopyTradingController::class, 'settings'])->name('copy-trading.settings');
        Route::post('/copy-trading/settings', [CopyTradingController::class, 'updateSettings'])->name('copy-trading.updateSettings');
        
        // Top Traders and Recent Trades
        Route::get('/copy-trading/top-traders', [CopyTradingController::class, 'topTraders'])->name('copy-trading.topTraders');
        
        // Copy Trading Approval Management
        Route::post('/copy-trading/{relationship}/approve', [CopyTradingController::class, 'approveRequest'])->name('copy-trading.approve');
        Route::post('/copy-trading/{relationship}/reject', [CopyTradingController::class, 'rejectRequest'])->name('copy-trading.reject');
        Route::post('/copy-trading/{relationship}/block', [CopyTradingController::class, 'blockCopier'])->name('copy-trading.block');
    });
});

// Debug routes
Route::middleware(['auth'])->group(function () {
    // CSRF token route for debugging
    Route::get('/csrf-token', function () {
        return response()->json([
            'csrf_token' => csrf_token(),
        ]);
    });
    
    Route::get('/test-deposit', function (\Illuminate\Http\Request $request) {
        $user = \Illuminate\Support\Facades\Auth::user();
        
        // Get the first active connected account
        $connectedAccount = $user->connectedAccounts()
            ->where('status', 'ACTIVE')
            ->first();
            
        if (!$connectedAccount) {
            return response()->json([
                'success' => false,
                'message' => 'No active connected accounts found.',
                'user_id' => $user->id,
            ]);
        }
        
        // Get or create a default USD wallet
        $wallet = $user->wallets()
            ->where('currency', 'USD')
            ->where('currency_type', 'FIAT')
            ->where('is_default', true)
            ->first();
            
        if (!$wallet) {
            // Create a new wallet
            $wallet = new \App\Models\Wallet();
            $wallet->id = (string) \Illuminate\Support\Str::uuid();
            $wallet->user_id = $user->id;
            $wallet->currency = 'USD';
            $wallet->currency_type = 'FIAT';
            $wallet->balance = 0;
            $wallet->available_balance = 0;
            $wallet->locked_balance = 0;
            $wallet->is_default = true;
            $wallet->save();
        }
        
        // Generate a unique reference ID
        $referenceId = 'TEST-DEP-' . strtoupper(substr(md5(uniqid()), 0, 10));
        
        // Create funding transaction
        $transaction = new \App\Models\FundingTransaction();
        $transaction->id = (string) \Illuminate\Support\Str::uuid();
        $transaction->user_id = $user->id;
        $transaction->connected_account_id = $connectedAccount->id;
        $transaction->wallet_id = $wallet->id;
        $transaction->transaction_type = 'DEPOSIT';
        $transaction->amount = 100; // Test with $100
        $transaction->status = 'COMPLETED';
        $transaction->reference_id = $referenceId;
        $transaction->description = 'Test deposit';
        $transaction->save();
        
        // Update wallet balance
        $wallet->balance += 100;
        $wallet->available_balance += 100;
        $wallet->save();
        
        // Create wallet transaction record
        $walletTransaction = new \App\Models\WalletTransaction();
        $walletTransaction->id = (string) \Illuminate\Support\Str::uuid();
        $walletTransaction->wallet_id = $wallet->id;
        $walletTransaction->user_id = $user->id;
        $walletTransaction->transaction_type = 'DEPOSIT';
        $walletTransaction->amount = 100;
        $walletTransaction->fee = 0;
        $walletTransaction->status = 'COMPLETED';
        $walletTransaction->description = 'Test deposit';
        $walletTransaction->reference_id = $referenceId;
        $walletTransaction->metadata = [
            'funding_transaction_id' => $transaction->id,
            'connected_account_id' => $connectedAccount->id,
        ];
        $walletTransaction->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Test deposit processed successfully.',
            'user' => $user,
            'connected_account' => $connectedAccount,
            'wallet' => $wallet->refresh(),
            'transaction' => $transaction,
            'wallet_transaction' => $walletTransaction,
        ]);
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
