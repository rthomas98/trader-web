<?php

namespace Database\Factories;

use App\Models\TradingOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TradingOrder>
 */
class TradingOrderFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = TradingOrder::class;

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
        
        $side = $this->faker->randomElement(['BUY', 'SELL']);
        $orderType = $this->faker->randomElement(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']);
        $price = $this->faker->randomFloat(2, 1, 60000);
        $quantity = $this->faker->randomFloat(2, 0.1, 10);
        
        return [
            'user_id' => User::factory(),
            'currency_pair' => $this->faker->randomElement($currencyPairs),
            'order_type' => $orderType,
            'side' => $side,
            'price' => $price,
            'quantity' => $quantity,
            'status' => $this->faker->randomElement(['PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']),
            'time_in_force' => $this->faker->randomElement(['GTC', 'IOC', 'FOK', 'DAY']),
            'stop_loss' => $this->faker->optional(0.7)->randomFloat(2, $price * 0.9, $price * 0.99),
            'take_profit' => $this->faker->optional(0.7)->randomFloat(2, $price * 1.01, $price * 1.2),
        ];
    }
    
    /**
     * Configure the model factory to create a pending order.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function pending()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'PENDING',
            ];
        });
    }
    
    /**
     * Configure the model factory to create a filled order.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function filled()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'FILLED',
            ];
        });
    }
    
    /**
     * Configure the model factory to create a cancelled order.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function cancelled()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'CANCELLED',
            ];
        });
    }
    
    /**
     * Configure the model factory to create a limit order.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function limit()
    {
        return $this->state(function (array $attributes) {
            return [
                'order_type' => 'LIMIT',
            ];
        });
    }
    
    /**
     * Configure the model factory to create a market order.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function market()
    {
        return $this->state(function (array $attributes) {
            return [
                'order_type' => 'MARKET',
            ];
        });
    }
}
