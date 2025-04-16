<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Watchlist>
 */
class WatchlistFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        // Define a list of common currency pairs
        $symbols = [
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD',
            'USD/CAD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
            'AUD/JPY', 'CHF/JPY', 'CAD/JPY', 'NZD/JPY', 'EUR/AUD',
            'GBP/AUD', 'EUR/CAD', 'GBP/CAD', 'EUR/CHF', 'GBP/CHF',
        ];

        return [
            'user_id' => User::factory(), // Assign to a user (will create one if none exists)
            'symbol' => $this->faker->unique()->randomElement($symbols), // Pick a unique symbol
        ];
    }
}
