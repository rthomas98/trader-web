<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a default admin user if it doesn't exist
        if (!User::where('email', 'admin@example.com')->exists()) {
            User::create([
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'onboarding_completed' => true,
                'risk_tolerance_level' => 'moderate',
                'risk_percentage' => 2.0,
                'max_drawdown_percentage' => 10.0,
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => true,
            ]);
        }
        
        // Create a test user if it doesn't exist
        if (!User::where('email', 'test@example.com')->exists()) {
            User::create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'onboarding_completed' => true,
                'risk_tolerance_level' => 'conservative',
                'risk_percentage' => 1.0,
                'max_drawdown_percentage' => 5.0,
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => true,
            ]);
        }
        
        // Create additional users with different risk profiles if they don't exist
        if (!User::where('email', 'conservative@example.com')->exists()) {
            User::create([
                'name' => 'Conservative Trader',
                'email' => 'conservative@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'onboarding_completed' => true,
                'risk_tolerance_level' => 'conservative',
                'risk_percentage' => 0.5,
                'max_drawdown_percentage' => 3.0,
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => true,
            ]);
        }
        
        if (!User::where('email', 'moderate@example.com')->exists()) {
            User::create([
                'name' => 'Moderate Trader',
                'email' => 'moderate@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'onboarding_completed' => true,
                'risk_tolerance_level' => 'moderate',
                'risk_percentage' => 2.0,
                'max_drawdown_percentage' => 8.0,
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => true,
            ]);
        }
        
        if (!User::where('email', 'aggressive@example.com')->exists()) {
            User::create([
                'name' => 'Aggressive Trader',
                'email' => 'aggressive@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'onboarding_completed' => true,
                'risk_tolerance_level' => 'aggressive',
                'risk_percentage' => 5.0,
                'max_drawdown_percentage' => 15.0,
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => true,
            ]);
        }
        
        // Create some additional users for testing if we don't have enough
        $currentUserCount = User::count();
        if ($currentUserCount < 20) {
            $additionalCount = 20 - $currentUserCount;
            User::factory()->count($additionalCount)->create();
        }
        
        $this->command->info('Created ' . User::count() . ' users successfully.');
    }
}
