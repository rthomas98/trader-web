<?php

namespace Database\Factories;

use App\Models\User; // Import User model
use App\Models\JournalEntry; // Import the JournalEntry model
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JournalEntry>
 */
class JournalEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $entryPrice = $this->faker->randomFloat(5, 1.0, 1.5);
        $direction = $this->faker->randomElement(['long', 'short']);
        $outcome = $this->faker->randomElement(['win', 'loss', 'breakeven']);
        $exitPrice = null;
        $profitLoss = null;

        if ($outcome === 'win') {
            $exitPrice = $direction === 'long' ? $entryPrice * (1 + $this->faker->randomFloat(3, 0.01, 0.05)) : $entryPrice * (1 - $this->faker->randomFloat(3, 0.01, 0.05));
            $profitLoss = $this->faker->randomFloat(2, 50, 500);
        } elseif ($outcome === 'loss') {
            $exitPrice = $direction === 'long' ? $entryPrice * (1 - $this->faker->randomFloat(3, 0.01, 0.03)) : $entryPrice * (1 + $this->faker->randomFloat(3, 0.01, 0.03));
            $profitLoss = $this->faker->randomFloat(2, -300, -20);
        } else { // breakeven
            $exitPrice = $entryPrice;
            $profitLoss = 0;
        }

        $entryAt = $this->faker->dateTimeBetween('-1 year', 'now');
        $exitAt = $this->faker->dateTimeBetween($entryAt, 'now');

        return [
            'user_id' => User::factory(), // Associate with a new or existing user
            'pair' => $this->faker->randomElement(['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD']),
            'direction' => $direction,
            'entry_price' => $entryPrice,
            'exit_price' => $exitPrice,
            'stop_loss' => $direction === 'long' ? $entryPrice * 0.99 : $entryPrice * 1.01,
            'take_profit' => $direction === 'long' ? $entryPrice * 1.03 : $entryPrice * 0.97,
            'risk_reward_ratio' => $this->faker->randomFloat(2, 1, 5),
            'profit_loss' => $profitLoss,
            'outcome' => $outcome,
            'entry_at' => $entryAt,
            'exit_at' => $exitAt,
            'setup_reason' => $this->faker->sentence(),
            'execution_notes' => $this->faker->paragraph(),
            'post_trade_analysis' => $this->faker->paragraph(),
            'image_before' => null, // Or use $this->faker->imageUrl()
            'image_after' => null,
            'tags' => $this->faker->randomElements(['Scalping', 'Swing Trading', 'News Event', 'Breakout', 'Trend Following'], $this->faker->numberBetween(1, 3)),
        ];
    }
}
