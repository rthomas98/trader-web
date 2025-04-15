<?php

namespace Database\Seeders;

use App\Models\TradingWallet;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TradingWalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users
        $users = User::all();
        
        foreach ($users as $user) {
            // Check if demo wallet exists
            if (!TradingWallet::where('user_id', $user->id)->where('wallet_type', 'DEMO')->exists()) {
                // Create a demo wallet for the user
                TradingWallet::factory()->demo()->create([
                    'user_id' => $user->id,
                    'is_active' => true,
                ]);
            }
            
            // Check if live wallet exists
            if (!TradingWallet::where('user_id', $user->id)->where('wallet_type', 'LIVE')->exists()) {
                // Create a live wallet for the user (initially with zero balance)
                TradingWallet::factory()->live()->create([
                    'user_id' => $user->id,
                    'is_active' => false, // Demo mode is enabled by default
                ]);
            }
        }
    }
}
