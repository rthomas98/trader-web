<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Wallet>
 */
class WalletFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Wallet::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $currencies = [
            'FIAT' => ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
            'CRYPTO' => ['BTC', 'ETH', 'XRP', 'LTC', 'ADA', 'DOT', 'SOL']
        ];
        
        $currencyType = $this->faker->randomElement(['FIAT', 'CRYPTO']);
        $currency = $this->faker->randomElement($currencies[$currencyType]);
        
        $balance = $this->faker->randomFloat(2, 1000, 50000);
        $lockedBalance = $this->faker->randomFloat(2, 0, $balance * 0.1);
        $availableBalance = $balance - $lockedBalance;
        
        return [
            'user_id' => User::factory(),
            'currency' => $currency,
            'currency_type' => $currencyType,
            'balance' => $balance,
            'available_balance' => $availableBalance,
            'locked_balance' => $lockedBalance,
            'is_default' => $this->faker->boolean(20), // 20% chance of being default
        ];
    }
    
    /**
     * Indicate that the wallet is the default one.
     *
     * @return static
     */
    public function default()
    {
        return $this->state(function (array $attributes) {
            return [
                'is_default' => true,
            ];
        });
    }
}
