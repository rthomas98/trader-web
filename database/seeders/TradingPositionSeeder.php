<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\TradingPosition;

class TradingPositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(): void
    {
        // Get the first 3 users, or however many exist if fewer than 3
        $users = User::take(3)->get();

        if ($users->isEmpty()) {
            $this->command->info('No users found, skipping TradingPosition seeding.');
            return;
        }

        $this->command->info('Seeding TradingPositions for ' . $users->count() . ' users...');

        foreach ($users as $user) {
            TradingPosition::factory()
                ->count(15) // Create 15 closed positions per user
                ->closed() // Use the 'closed' state defined in the factory
                ->for($user) // Associate with the current user
                ->create();
        }
        
        $this->command->info('TradingPositions seeded successfully.');
    }
}
