<?php

namespace Database\Factories;

use App\Models\TradingWallet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TradingWallet>
 */
class TradingWalletFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'wallet_type' => $this->faker->randomElement(['DEMO', 'LIVE']),
            'balance' => $this->faker->randomFloat(2, 10000, 100000),
            'available_margin' => $this->faker->randomFloat(2, 5000, 50000),
            'used_margin' => $this->faker->randomFloat(2, 0, 5000),
            'equity' => $this->faker->randomFloat(2, 10000, 100000),
            'leverage' => $this->faker->randomElement([5, 10, 20, 50, 100]),
            'margin_call_level' => 80,
            'margin_stop_out_level' => 50,
            'is_active' => true,
        ];
    }

    /**
     * Configure the model factory to create a demo wallet.
     *
     * @return $this
     */
    public function demo()
    {
        return $this->state(function (array $attributes) {
            return [
                'wallet_type' => 'DEMO',
                'balance' => 50000.00,
                'available_margin' => 50000.00,
                'used_margin' => 0.00,
                'equity' => 50000.00,
            ];
        });
    }

    /**
     * Configure the model factory to create a live wallet.
     *
     * @return $this
     */
    public function live()
    {
        return $this->state(function (array $attributes) {
            return [
                'wallet_type' => 'LIVE',
                'balance' => 0.00,
                'available_margin' => 0.00,
                'used_margin' => 0.00,
                'equity' => 0.00,
            ];
        });
    }
}
