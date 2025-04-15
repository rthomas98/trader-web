<?php

namespace Database\Factories;

use App\Models\PortfolioPosition;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PortfolioPosition>
 */
class PortfolioPositionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = PortfolioPosition::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $stocks = [
            'AAPL' => 'Apple Inc.',
            'MSFT' => 'Microsoft Corporation',
            'GOOGL' => 'Alphabet Inc.',
            'AMZN' => 'Amazon.com Inc.',
            'TSLA' => 'Tesla Inc.',
            'META' => 'Meta Platforms Inc.',
            'NVDA' => 'NVIDIA Corporation',
            'JPM' => 'JPMorgan Chase & Co.',
            'V' => 'Visa Inc.',
            'JNJ' => 'Johnson & Johnson'
        ];
        
        $symbol = $this->faker->randomElement(array_keys($stocks));
        $name = $stocks[$symbol];
        $categories = ['Technology', 'Finance', 'Healthcare', 'Consumer', 'Energy', 'Industrial'];
        
        return [
            'user_id' => User::factory(),
            'symbol' => $symbol,
            'name' => $name,
            'quantity' => $this->faker->randomFloat(2, 1, 1000),
            'average_price' => $this->faker->randomFloat(2, 50, 1000),
            'category' => $this->faker->randomElement($categories),
            'notes' => $this->faker->optional(0.7)->sentence(),
        ];
    }
}
