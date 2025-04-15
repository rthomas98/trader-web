<?php

namespace Database\Factories;

use App\Models\ConnectedAccount;
use App\Models\FundingTransaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FundingTransaction>
 */
class FundingTransactionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = FundingTransaction::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $transactionTypes = ['DEPOSIT', 'WITHDRAWAL'];
        $statuses = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];
        
        $transactionType = $this->faker->randomElement($transactionTypes);
        
        return [
            'user_id' => User::factory(),
            'connected_account_id' => ConnectedAccount::factory(),
            'wallet_id' => Wallet::factory(),
            'transaction_type' => $transactionType,
            'amount' => $this->faker->randomFloat(2, 100, 5000),
            'status' => $this->faker->randomElement($statuses),
            'reference_id' => 'ref-' . Str::uuid(),
            'description' => $transactionType === 'DEPOSIT' 
                ? 'Deposit from ' . $this->faker->company() . ' account'
                : 'Withdrawal to ' . $this->faker->company() . ' account',
            'notes' => $this->faker->optional(0.3)->sentence(),
            'metadata' => json_encode([
                'processor' => $this->faker->randomElement(['ACH', 'Wire', 'Plaid', 'Stripe']),
                'fee' => $this->faker->randomFloat(2, 0, 25),
                'processing_time' => $this->faker->numberBetween(1, 5) . ' business days',
            ]),
        ];
    }
    
    /**
     * Configure the model factory to create a completed transaction.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function completed()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'COMPLETED',
            ];
        });
    }
    
    /**
     * Configure the model factory to create a pending transaction.
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
}
