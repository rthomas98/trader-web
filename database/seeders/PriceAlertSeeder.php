<?php

namespace Database\Seeders;

use App\Models\PriceAlert;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PriceAlertSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users
        $users = User::all();
        
        foreach ($users as $user) {
            // Create some active price alerts for each user
            PriceAlert::factory()
                ->count(3)
                ->forSymbol('EURUSD')
                ->create(['user_id' => $user->id]);
                
            PriceAlert::factory()
                ->count(2)
                ->forSymbol('GBPUSD')
                ->create(['user_id' => $user->id]);
                
            PriceAlert::factory()
                ->count(2)
                ->withCondition('percent_change')
                ->create(['user_id' => $user->id]);
                
            // Create some triggered price alerts for each user
            PriceAlert::factory()
                ->count(5)
                ->triggered()
                ->create(['user_id' => $user->id]);
                
            // Create some recurring price alerts
            PriceAlert::factory()
                ->count(2)
                ->recurring()
                ->create(['user_id' => $user->id]);
        }
    }
}
