<?php

namespace Database\Factories;

use App\Models\PriceAlert;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PriceAlert>
 */
class PriceAlertFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = PriceAlert::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'];
        $conditions = ['above', 'below', 'percent_change'];
        $condition = $this->faker->randomElement($conditions);
        
        return [
            'user_id' => User::factory(),
            'symbol' => $this->faker->randomElement($symbols),
            'condition' => $condition,
            'price' => $this->faker->randomFloat(5, 0.5, 2),
            'percent_change' => $condition === 'percent_change' ? $this->faker->randomFloat(2, 0.5, 5) : null,
            'is_recurring' => $this->faker->boolean(30),
            'is_triggered' => false,
            'triggered_at' => null,
        ];
    }
    
    /**
     * Configure the model to be already triggered.
     *
     * @return static
     */
    public function triggered(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_triggered' => true,
            'triggered_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ]);
    }
    
    /**
     * Configure the model to be for a specific condition.
     *
     * @param string $condition
     * @return static
     */
    public function withCondition(string $condition): static
    {
        $percentChange = null;
        if ($condition === 'percent_change') {
            $percentChange = $this->faker->randomFloat(2, 0.5, 5);
        }
        
        return $this->state(fn (array $attributes) => [
            'condition' => $condition,
            'percent_change' => $percentChange,
        ]);
    }
    
    /**
     * Configure the model to be for a specific symbol.
     *
     * @param string $symbol
     * @return static
     */
    public function forSymbol(string $symbol): static
    {
        return $this->state(fn (array $attributes) => [
            'symbol' => strtoupper($symbol),
        ]);
    }
    
    /**
     * Configure the model to be recurring.
     *
     * @return static
     */
    public function recurring(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_recurring' => true,
        ]);
    }
}
