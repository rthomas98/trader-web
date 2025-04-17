<?php

namespace Database\Seeders;

use App\Models\CopyTradingRelationship;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CopyTradingRelationshipSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing users or create new ones if needed
        $users = User::all();
        
        if ($users->count() < 10) {
            // Create more users if we don't have enough
            User::factory()->count(20)->create();
            $users = User::all();
        }
        
        // Ensure we have enough users for the seeder
        $userCount = $users->count();
        
        // Select some users to be popular traders (users with many copiers)
        $popularTraderCount = min(3, (int)($userCount / 4)); // Use at most 1/4 of users as popular traders
        $popularTraders = $users->random($popularTraderCount);
        
        // Create copy relationships for popular traders
        foreach ($popularTraders as $trader) {
            // Calculate how many copiers we can have (at most half of remaining users)
            $maxCopiers = min(15, (int)(($userCount - $popularTraderCount) / 2));
            $minCopiers = min(5, max(1, (int)($maxCopiers / 3)));
            $copierCount = rand($minCopiers, $maxCopiers);
            
            // Each popular trader gets some copiers
            $copiers = $users->where('id', '!=', $trader->id)->random($copierCount);
            
            foreach ($copiers as $copier) {
                // Create active copy relationships
                CopyTradingRelationship::factory()
                    ->active()
                    ->create([
                        'trader_user_id' => $trader->id,
                        'copier_user_id' => $copier->id,
                    ]);
            }
            
            // Also create some paused and stopped relationships for diversity
            // Calculate remaining users who aren't already copiers
            $remainingUsers = $users->where('id', '!=', $trader->id)
                ->whereNotIn('id', $copiers->pluck('id'));
                
            if ($remainingUsers->count() > 0) {
                $additionalCopierCount = min(5, $remainingUsers->count());
                $additionalCopiers = $remainingUsers->random($additionalCopierCount);
                
                foreach ($additionalCopiers as $copier) {
                    // 50% chance of paused, 50% chance of stopped
                    $status = rand(0, 1) ? 'paused' : 'stopped';
                    
                    CopyTradingRelationship::factory()
                        ->$status()
                        ->create([
                            'trader_user_id' => $trader->id,
                            'copier_user_id' => $copier->id,
                        ]);
                }
            }
        }
        
        // Create some random copy relationships between other users
        $randomRelationshipCount = min(10, $userCount);
        
        for ($i = 0; $i < $randomRelationshipCount; $i++) {
            // Ensure we have at least 2 users
            if ($userCount < 2) {
                break;
            }
            
            $trader = $users->random();
            $availableCopiers = $users->where('id', '!=', $trader->id);
            
            // Skip if no available copiers
            if ($availableCopiers->count() === 0) {
                continue;
            }
            
            $copier = $availableCopiers->random();
            
            // Skip if this relationship already exists
            if (CopyTradingRelationship::where('trader_user_id', $trader->id)
                ->where('copier_user_id', $copier->id)
                ->exists()) {
                continue;
            }
            
            // Create with random status
            $status = ['active', 'paused', 'stopped'][rand(0, 2)];
            
            CopyTradingRelationship::factory()
                ->$status()
                ->create([
                    'trader_user_id' => $trader->id,
                    'copier_user_id' => $copier->id,
                ]);
        }
    }
}
