<?php

namespace Database\Factories;

use App\Models\MarketNews;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MarketNews>
 */
class MarketNewsFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = MarketNews::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sources = ['Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Wall Street Journal', 'MarketWatch'];
        $categories = ['market', 'company', 'economy'];
        $sentiments = ['positive', 'negative', 'neutral'];
        
        $headline = $this->faker->sentence();
        // Ensure URL is unique by using a timestamp and random string
        $url = 'https://finance-news.example.com/' . time() . '-' . $this->faker->unique()->slug();
        
        return [
            'url' => $url,
            'headline' => $headline,
            'summary' => $this->faker->paragraph(),
            'published_at' => $this->faker->dateTimeBetween('-7 days', 'now'),
            'source' => $this->faker->randomElement($sources),
            'category' => $this->faker->randomElement($categories),
            'topics' => json_encode([$this->faker->word(), $this->faker->word()]),
            'sentiment' => $this->faker->randomElement($sentiments),
        ];
    }
}
