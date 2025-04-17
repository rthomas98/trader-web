<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TradingStrategy>
 */
class TradingStrategyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['Scalping', 'Day Trading', 'Swing Trading', 'Position Trading', 'Algorithmic'];
        $riskLevels = ['Low', 'Medium', 'High'];
        $assets = ['EUR/USD', 'GBP/JPY', 'USD/CAD', 'AUD/USD', 'BTC/USD', 'ETH/USD', 'AAPL', 'TSLA'];
        $timeframes = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];

        return [
            'user_id' => User::inRandomOrder()->first()->id, // Assign to a random existing user
            'name' => $this->faker->unique()->catchPhrase() . ' Strategy', // Generate a unique name
            'description' => $this->faker->optional()->paragraph(2), // Generate an optional description
            'type' => $this->faker->optional()->randomElement($types),
            'risk_level' => $this->faker->optional()->randomElement($riskLevels),
            'target_assets' => $this->faker->optional()->randomElement($assets), // Keep it simple for now, maybe just one asset
            'timeframe' => $this->faker->optional()->randomElement($timeframes),
        ];
    }
}
