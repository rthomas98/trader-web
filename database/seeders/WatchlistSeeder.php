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

        // Create 5 watchlist items for the user
        // Ensure unique symbols by using the factory's unique faker modifier
        Watchlist::factory()->count(5)->for($user)->create();
    }
}
