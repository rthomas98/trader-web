<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\TradingWallet;
use Database\Seeders\DashboardSeeder;
use Database\Seeders\TradingDataSeeder;
use Database\Seeders\TradingPositionSeeder;
use Database\Seeders\TradingWalletSeeder;
use Database\Seeders\WatchlistSeeder;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // User::factory(10)->create();

        // Create the test user only if they don't exist
        User::firstOrCreate(
            ['email' => 'test@example.com'], // Attributes to find
            [
                'name' => 'Test User',
                'password' => Hash::make('password') // Provide required fields if creating
            ]
        );
        
        // Seed dashboard data
        $this->call([
            DashboardSeeder::class,
            TradingDataSeeder::class,
            TradingWalletSeeder::class,
            TradingPositionSeeder::class,
            WatchlistSeeder::class,
        ]);
    }
}
