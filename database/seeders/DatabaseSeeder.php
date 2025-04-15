<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\DashboardSeeder;
use Database\Seeders\TradingDataSeeder;
use Database\Seeders\TradingWalletSeeder;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
        
        // Seed dashboard data
        $this->call([
            DashboardSeeder::class,
            TradingDataSeeder::class,
            TradingWalletSeeder::class,
        ]);
    }
}
