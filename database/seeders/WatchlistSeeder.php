<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Watchlist;

class WatchlistSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get the first user (or create one if none exists)
        $user = User::first();

        if (!$user) {
            $user = User::factory()->create(); // Create a user if the table is empty
        }

        $symbolsToAdd = ['EUR/USD', 'GBP/JPY', 'AUD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/AUD', 'GBP/USD']; // Define a list of symbols
        $addedCount = 0;
        $maxToAdd = 5; // Target number of watchlist items

        foreach ($symbolsToAdd as $symbol) {
            if ($addedCount >= $maxToAdd) {
                break;
            }

            Watchlist::firstOrCreate(
                ['user_id' => $user->id, 'symbol' => $symbol] // Attributes to find
                // No additional attributes needed here unless the factory sets specific defaults you want
            );
            $addedCount++;
        }

        // Optional: If you need exactly 5 and the list wasn't enough,
        // you could add more symbols or logic here.
    }
}
