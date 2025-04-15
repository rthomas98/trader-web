<?php

namespace Database\Seeders;

use App\Models\ConnectedAccount;
use App\Models\EconomicCalendar;
use App\Models\FundingTransaction;
use App\Models\MarketNews;
use App\Models\PortfolioPosition;
use App\Models\TradingPosition;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class DashboardSeeder extends Seeder
{
    /**
     * Seed the application's dashboard data.
     */
    public function run(): void
    {
        // Create test users if none exist
        if (User::count() === 0) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }
        
        $users = User::all();
        
        // Seed connected accounts for each user
        foreach ($users as $user) {
            // Create a default connected account
            $defaultAccount = ConnectedAccount::factory()->verified()->default()->create([
                'user_id' => $user->id,
                'institution_name' => 'Chase',
                'account_name' => 'Primary Checking',
                'account_type' => 'depository',
                'account_subtype' => 'checking',
                'current_balance' => 35000,
                'available_balance' => 34500,
            ]);
            
            // Create additional connected accounts
            ConnectedAccount::factory()->count(2)->verified()->create([
                'user_id' => $user->id,
                'is_default' => false,
            ]);
            
            // Create one pending account
            ConnectedAccount::factory()->create([
                'user_id' => $user->id,
                'is_default' => false,
                'is_verified' => false,
                'status' => 'PENDING',
            ]);
        }
        
        // Seed wallets for each user
        foreach ($users as $user) {
            // Get the user's connected accounts
            $connectedAccounts = ConnectedAccount::where('user_id', $user->id)->get();
            $defaultConnectedAccount = $connectedAccounts->where('is_default', true)->first();
            
            // Create USD wallet (default)
            $defaultWallet = Wallet::factory()->create([
                'user_id' => $user->id,
                'currency' => 'USD',
                'currency_type' => 'FIAT',
                'is_default' => true,
                'balance' => 25000,
                'available_balance' => 23500,
                'locked_balance' => 1500,
            ]);
            
            // Create additional wallets
            $additionalWallets = [];
            for ($i = 0; $i < 3; $i++) {
                $additionalWallets[] = Wallet::factory()->create([
                    'user_id' => $user->id,
                    'is_default' => false,
                ]);
            }
            
            // Create funding transactions for the default wallet
            if ($defaultConnectedAccount) {
                // Create completed deposits
                FundingTransaction::factory()->count(3)->completed()->create([
                    'user_id' => $user->id,
                    'connected_account_id' => $defaultConnectedAccount->id,
                    'wallet_id' => $defaultWallet->id,
                    'transaction_type' => 'DEPOSIT',
                    'status' => 'COMPLETED',
                ]);
                
                // Create one pending deposit
                FundingTransaction::factory()->pending()->create([
                    'user_id' => $user->id,
                    'connected_account_id' => $defaultConnectedAccount->id,
                    'wallet_id' => $defaultWallet->id,
                    'transaction_type' => 'DEPOSIT',
                    'status' => 'PENDING',
                ]);
                
                // Create one completed withdrawal
                FundingTransaction::factory()->completed()->create([
                    'user_id' => $user->id,
                    'connected_account_id' => $defaultConnectedAccount->id,
                    'wallet_id' => $defaultWallet->id,
                    'transaction_type' => 'WITHDRAWAL',
                    'status' => 'COMPLETED',
                ]);
            }
            
            // Create some funding transactions for other wallets and connected accounts
            foreach ($additionalWallets as $index => $wallet) {
                if (isset($connectedAccounts[$index])) {
                    FundingTransaction::factory()->count(2)->completed()->create([
                        'user_id' => $user->id,
                        'connected_account_id' => $connectedAccounts[$index]->id,
                        'wallet_id' => $wallet->id,
                        'transaction_type' => 'DEPOSIT',
                        'status' => 'COMPLETED',
                    ]);
                }
            }
        }
        
        // Seed trading positions
        foreach ($users as $user) {
            // Create open trading positions
            TradingPosition::factory()->count(7)->open()->create([
                'user_id' => $user->id,
            ]);
            
            // Create closed trading positions
            TradingPosition::factory()->count(10)->closed()->create([
                'user_id' => $user->id,
            ]);
        }
        
        // Seed portfolio positions
        foreach ($users as $user) {
            PortfolioPosition::factory()->count(8)->create([
                'user_id' => $user->id,
            ]);
        }
        
        // Seed market news (global, not user-specific)
        if (MarketNews::count() === 0) {
            MarketNews::factory()->count(20)->create();
        }
        
        // Seed economic calendar events (global, not user-specific)
        if (EconomicCalendar::count() === 0) {
            EconomicCalendar::factory()->count(30)->create();
        }
    }
}
