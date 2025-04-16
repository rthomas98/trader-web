<?php

namespace Database\Factories;

use App\Models\TradingPosition;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TradingPosition>
 */
class TradingPositionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = TradingPosition::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $currencyPairs = [
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD',
            'BTC/USD', 'ETH/USD', 'XRP/USD', 'LTC/USD', 'ADA/USD', 'DOT/USD'
        ];
        
        $tradeType = $this->faker->randomElement(['BUY', 'SELL']);
        $entryPrice = $this->faker->randomFloat(2, 1, 60000);
        $quantity = $this->faker->randomFloat(2, 0.1, 10);
        
        // Default to open position
        $status = 'OPEN';
        $entryTime = $this->faker->dateTimeBetween('-30 days', 'now');
        $exitTime = null;
        $exitPrice = null;
        $profitLoss = null;
        
        return [
            'user_id' => User::factory(),
            'currency_pair' => $this->faker->randomElement($currencyPairs),
            'trade_type' => $tradeType,
            'entry_price' => $entryPrice,
            'quantity' => $quantity,
            'status' => $status,
            'entry_time' => $entryTime,
            'exit_time' => $exitTime,
            'exit_price' => $exitPrice,
            'profit_loss' => $profitLoss,
            'stop_loss' => $this->faker->optional(0.7)->randomFloat(2, $entryPrice * 0.9, $entryPrice * 0.99),
            'take_profit' => $this->faker->optional(0.7)->randomFloat(2, $entryPrice * 1.01, $entryPrice * 1.2),
        ];
    }
    
    /**
     * Configure the model factory to create an open position.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function open()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'OPEN',
                'exit_time' => null,
                'exit_price' => null,
                'profit_loss' => null,
            ];
        });
    }
    
    /**
     * Configure the model factory to create a closed position.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function closed()
    {
        return $this->state(function (array $attributes) {
            $entryPrice = $attributes['entry_price'] ?? $this->faker->randomFloat(2, 1, 60000); // Provide default if not set
            $tradeType = $attributes['trade_type'] ?? $this->faker->randomElement(['BUY', 'SELL']); // Provide default if not set
            $quantity = $attributes['quantity'] ?? $this->faker->randomFloat(2, 0.1, 10); // Provide default if not set
            $entryTime = $attributes['entry_time'] ?? $this->faker->dateTimeBetween('-30 days', '-1 day'); // Ensure entry time exists

            // Generate exit time after entry time
            $exitTime = $this->faker->dateTimeBetween($entryTime, 'now');

            // Generate exit price
            $exitPrice = $tradeType === 'BUY'
                ? $this->faker->randomFloat(2, $entryPrice * 0.8, $entryPrice * 1.2) // Simulate market fluctuation
                : $this->faker->randomFloat(2, $entryPrice * 0.8, $entryPrice * 1.2); // Simulate market fluctuation

            // Calculate profit/loss
            $profitLoss = ($tradeType === 'BUY')
                ? ($exitPrice - $entryPrice) * $quantity
                : ($entryPrice - $exitPrice) * $quantity;

            return [
                'status' => 'CLOSED',
                'exit_time' => $exitTime,
                'closed_at' => $exitTime, // Set closed_at to the same time as exit_time
                'exit_price' => $exitPrice,
                'profit_loss' => $profitLoss,
            ];
        });
    }
}
