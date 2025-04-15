<?php

namespace Database\Seeders;

use App\Models\TradingOrder;
use App\Models\TradingPosition;
use App\Models\TradingWallet;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class TradingDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users or create a demo user if none exists
        $users = User::all();
        
        if ($users->isEmpty()) {
            $users = [User::factory()->create([
                'name' => 'Demo User',
                'email' => 'demo@example.com',
                'password' => bcrypt('password'),
                'account_balance' => 50000.00,
                'available_margin' => 45000.00,
                'leverage' => 20,
                'risk_percentage' => 2.00,
                'onboarding_completed' => true,
            ])];
        }
        
        foreach ($users as $user) {
            // Create wallets for the user if they don't exist
            if (Wallet::where('user_id', $user->id)->count() === 0) {
                $this->createWalletsForUser($user);
            }
            
            // Create or get trading wallets for the user
            $demoWallet = $this->getOrCreateTradingWallet($user, 'DEMO');
            $liveWallet = $this->getOrCreateTradingWallet($user, 'LIVE');
            
            // Create trading positions
            $this->createTradingPositionsForUser($user, $demoWallet);
            
            // Create trading orders
            $this->createTradingOrdersForUser($user, $demoWallet);
        }
    }
    
    /**
     * Create wallets for a user.
     */
    private function createWalletsForUser(User $user): void
    {
        $currencies = [
            ['currency' => 'USD', 'type' => 'FIAT', 'balance' => 50000.00, 'is_default' => true],
            ['currency' => 'EUR', 'type' => 'FIAT', 'balance' => 25000.00],
            ['currency' => 'GBP', 'type' => 'FIAT', 'balance' => 20000.00],
            ['currency' => 'JPY', 'type' => 'FIAT', 'balance' => 3000000.00],
            ['currency' => 'BTC', 'type' => 'CRYPTO', 'balance' => 1.5],
            ['currency' => 'ETH', 'type' => 'CRYPTO', 'balance' => 15.0],
        ];
        
        foreach ($currencies as $currency) {
            Wallet::factory()->create([
                'user_id' => $user->id,
                'currency' => $currency['currency'],
                'currency_type' => $currency['type'],
                'balance' => $currency['balance'],
                'available_balance' => $currency['balance'],
                'locked_balance' => 0,
                'is_default' => $currency['is_default'] ?? false,
            ]);
        }
    }
    
    /**
     * Get or create a trading wallet for a user.
     */
    private function getOrCreateTradingWallet(User $user, string $walletType): TradingWallet
    {
        $wallet = TradingWallet::where('user_id', $user->id)
            ->where('wallet_type', $walletType)
            ->first();
            
        if (!$wallet) {
            $wallet = TradingWallet::factory()->create([
                'user_id' => $user->id,
                'wallet_type' => $walletType,
                'balance' => $walletType === 'DEMO' ? 50000.00 : 10000.00,
                'available_margin' => $walletType === 'DEMO' ? 45000.00 : 9000.00,
                'used_margin' => $walletType === 'DEMO' ? 5000.00 : 1000.00,
                'leverage' => 20,
                'risk_percentage' => 2.00,
                'is_active' => $walletType === 'DEMO',
                'equity' => $walletType === 'DEMO' ? 50000.00 : 10000.00,
                'margin_call_level' => 80,
                'margin_stop_out_level' => 50,
            ]);
        }
        
        return $wallet;
    }
    
    /**
     * Create trading positions for a user.
     */
    private function createTradingPositionsForUser(User $user, TradingWallet $tradingWallet): void
    {
        // Create open positions
        TradingPosition::factory()
            ->count(5)
            ->open()
            ->create([
                'user_id' => $user->id,
                'trading_wallet_id' => $tradingWallet->id,
            ]);
        
        // Create closed positions
        TradingPosition::factory()
            ->count(10)
            ->closed()
            ->create([
                'user_id' => $user->id,
                'trading_wallet_id' => $tradingWallet->id,
            ]);
    }
    
    /**
     * Create trading orders for a user.
     */
    private function createTradingOrdersForUser(User $user, TradingWallet $tradingWallet): void
    {
        // Create pending limit orders
        TradingOrder::factory()
            ->count(3)
            ->limit()
            ->pending()
            ->create([
                'user_id' => $user->id,
                'trading_wallet_id' => $tradingWallet->id,
            ]);
        
        // Create pending market orders
        TradingOrder::factory()
            ->count(2)
            ->market()
            ->pending()
            ->create([
                'user_id' => $user->id,
                'trading_wallet_id' => $tradingWallet->id,
            ]);
        
        // Create filled orders
        TradingOrder::factory()
            ->count(5)
            ->filled()
            ->create([
                'user_id' => $user->id,
                'trading_wallet_id' => $tradingWallet->id,
            ]);
        
        // Create cancelled orders
        TradingOrder::factory()
            ->count(3)
            ->cancelled()
            ->create([
                'user_id' => $user->id,
                'trading_wallet_id' => $tradingWallet->id,
            ]);
    }
}
