<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\TradingWallet;
use Database\Seeders\DashboardSeeder;
use Database\Seeders\TradingDataSeeder;
use Database\Seeders\TradingPositionSeeder;
use Database\Seeders\TradingWalletSeeder;
use Database\Seeders\WatchlistSeeder;
use Database\Seeders\RiskManagementSeeder;
use Database\Seeders\JournalEntrySeeder;
use Database\Seeders\SocialTradingSeeder;
use Database\Seeders\TradingStrategySeeder;
use Database\Seeders\CopyTradingRelationshipSeeder;
use Database\Seeders\TradeSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\FollowerSeeder;
use Database\Seeders\NotificationPreferenceSeeder;
use Database\Seeders\PriceAlertSeeder;
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
    public function run(): void
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
        
        // Uncomment the other seeders
        $this->call([
            UserSeeder::class,
            TradingStrategySeeder::class,
            FollowerSeeder::class,
            CopyTradingRelationshipSeeder::class,
            TradeSeeder::class,
            NotificationPreferenceSeeder::class,
            PriceAlertSeeder::class,
        ]);
    }
}
