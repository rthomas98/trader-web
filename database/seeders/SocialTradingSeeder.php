<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Factories\FollowFactory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SocialTradingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample users if they don't exist
        $this->createSampleUsers();
        
        // Create follow relationships between users
        $this->createFollowRelationships();
    }
    
    /**
     * Create sample users for the social trading feature.
     */
    private function createSampleUsers(): void
    {
        // Define sample traders with realistic names
        $sampleTraders = [
            [
                'name' => 'Alex Thompson',
                'email' => 'alex.thompson@example.com',
                'password' => Hash::make('password'),
                'account_balance' => 25000.00,
                'available_margin' => 20000.00,
                'leverage' => 10,
                'risk_percentage' => 2.0,
                'max_drawdown_percentage' => 10.0,
                'risk_tolerance_level' => 'moderate',
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => true,
            ],
            [
                'name' => 'Sarah Chen',
                'email' => 'sarah.chen@example.com',
                'password' => Hash::make('password'),
                'account_balance' => 50000.00,
                'available_margin' => 40000.00,
                'leverage' => 5,
                'risk_percentage' => 1.5,
                'max_drawdown_percentage' => 8.0,
                'risk_tolerance_level' => 'conservative',
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => false,
            ],
            [
                'name' => 'Michael Rodriguez',
                'email' => 'michael.rodriguez@example.com',
                'password' => Hash::make('password'),
                'account_balance' => 15000.00,
                'available_margin' => 12000.00,
                'leverage' => 20,
                'risk_percentage' => 3.0,
                'max_drawdown_percentage' => 15.0,
                'risk_tolerance_level' => 'aggressive',
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => true,
            ],
            [
                'name' => 'Emma Wilson',
                'email' => 'emma.wilson@example.com',
                'password' => Hash::make('password'),
                'account_balance' => 100000.00,
                'available_margin' => 80000.00,
                'leverage' => 2,
                'risk_percentage' => 1.0,
                'max_drawdown_percentage' => 5.0,
                'risk_tolerance_level' => 'conservative',
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => false,
            ],
            [
                'name' => 'David Kim',
                'email' => 'david.kim@example.com',
                'password' => Hash::make('password'),
                'account_balance' => 35000.00,
                'available_margin' => 28000.00,
                'leverage' => 10,
                'risk_percentage' => 2.5,
                'max_drawdown_percentage' => 12.0,
                'risk_tolerance_level' => 'moderate',
                'trading_account_type' => 'DEMO',
                'demo_mode_enabled' => true,
            ],
        ];
        
        // Create users if they don't exist
        foreach ($sampleTraders as $trader) {
            User::firstOrCreate(
                ['email' => $trader['email']],
                $trader
            );
        }
        
        // Output success message
        $this->command->info('Sample traders created successfully.');
    }
    
    /**
     * Create follow relationships between users.
     */
    private function createFollowRelationships(): void
    {
        // Get all users
        $users = User::all();
        
        if ($users->count() < 2) {
            $this->command->error('Not enough users to create follow relationships.');
            return;
        }
        
        // Create a follow factory instance
        $followFactory = new FollowFactory();
        
        // Create random follow relationships
        $followCount = 0;
        $maxFollows = 20; // Limit the number of follows to create
        
        for ($i = 0; $i < $maxFollows; $i++) {
            // Get two random users
            $follower = $users->random();
            $following = $users->random();
            
            // Create the follow relationship
            $followFactory->createFollow($follower->id, $following->id);
            
            // Increment the follow count
            $followCount++;
        }
        
        // Output success message
        $this->command->info("{$followCount} follow relationships created successfully.");
    }
}
