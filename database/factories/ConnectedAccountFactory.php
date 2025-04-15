<?php

namespace Database\Factories;

use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ConnectedAccount>
 */
class ConnectedAccountFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ConnectedAccount::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $institutions = [
            'ins_1' => 'Chase',
            'ins_2' => 'Bank of America',
            'ins_3' => 'Wells Fargo',
            'ins_4' => 'Citibank',
            'ins_5' => 'Capital One',
            'ins_6' => 'TD Bank',
            'ins_7' => 'US Bank',
            'ins_8' => 'PNC Bank',
            'ins_9' => 'Ally Bank',
            'ins_10' => 'Discover Bank'
        ];
        
        $accountTypes = ['depository', 'credit', 'loan', 'investment', 'other'];
        $accountSubtypes = [
            'depository' => ['checking', 'savings', 'money market', 'cd', 'cash management'],
            'credit' => ['credit card', 'line of credit'],
            'loan' => ['mortgage', 'student', 'auto', 'personal'],
            'investment' => ['brokerage', '401k', 'ira', 'roth', '529', 'hsa'],
            'other' => ['other']
        ];
        
        $institutionId = $this->faker->randomElement(array_keys($institutions));
        $institutionName = $institutions[$institutionId];
        $accountType = $this->faker->randomElement($accountTypes);
        $accountSubtype = $this->faker->randomElement($accountSubtypes[$accountType]);
        
        return [
            'user_id' => User::factory(),
            'institution_id' => $institutionId,
            'institution_name' => $institutionName,
            'account_id' => 'acc_' . Str::random(16),
            'account_name' => $accountType . ' ' . $accountSubtype,
            'account_type' => $accountType,
            'account_subtype' => $accountSubtype,
            'mask' => $this->faker->numerify('####'),
            'available_balance' => $this->faker->randomFloat(2, 1000, 100000),
            'current_balance' => function (array $attributes) {
                return $this->faker->randomFloat(2, $attributes['available_balance'], $attributes['available_balance'] + 5000);
            },
            'iso_currency_code' => 'USD',
            'status' => $this->faker->randomElement(['ACTIVE', 'INACTIVE', 'PENDING']),
            'is_verified' => $this->faker->boolean(80),
            'is_default' => false,
            'plaid_access_token' => 'access-' . Str::random(32),
            'plaid_item_id' => 'item-' . Str::random(24),
            'metadata' => json_encode([
                'last_updated' => $this->faker->dateTimeThisMonth()->format('Y-m-d H:i:s'),
                'last_transaction_date' => $this->faker->dateTimeThisMonth()->format('Y-m-d'),
                'transaction_count' => $this->faker->numberBetween(5, 100)
            ]),
        ];
    }
    
    /**
     * Indicate this is the default connected account.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function default()
    {
        return $this->state(function (array $attributes) {
            return [
                'is_default' => true,
            ];
        });
    }
    
    /**
     * Set the account as verified.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function verified()
    {
        return $this->state(function (array $attributes) {
            return [
                'is_verified' => true,
                'status' => 'ACTIVE',
            ];
        });
    }
}
