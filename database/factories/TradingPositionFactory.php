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
            $entryPrice = $attributes['entry_price'];
            $tradeType = $attributes['trade_type'];
            $quantity = $attributes['quantity'];
            
            // Generate a random exit price that would result in either profit or loss
            $exitPrice = $tradeType === 'BUY'
                ? $this->faker->randomFloat(2, $entryPrice * 0.8, $entryPrice * 1.2)
                : $this->faker->randomFloat(2, $entryPrice * 0.8, $entryPrice * 1.2);
            
            // Calculate profit/loss based on trade type
            $profitLoss = $tradeType === 'BUY'
                ? ($exitPrice - $entryPrice) * $quantity
                : ($entryPrice - $exitPrice) * $quantity;
            
            return [
                'status' => 'CLOSED',
                'exit_time' => $this->faker->dateTimeBetween($attributes['entry_time'], 'now'),
                'exit_price' => $exitPrice,
                'profit_loss' => $profitLoss,
            ];
        });
    }
}
