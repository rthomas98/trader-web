<?php

namespace Database\Factories;

use App\Models\EconomicCalendar;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EconomicCalendar>
 */
class EconomicCalendarFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = EconomicCalendar::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $countries = ['US', 'EU', 'UK', 'JP', 'CN', 'AU', 'CA'];
        $impacts = ['high', 'medium', 'low'];
        $eventTypes = [
            'Interest Rate Decision',
            'GDP',
            'Unemployment Rate',
            'CPI',
            'Retail Sales',
            'Manufacturing PMI',
            'Non-Farm Payrolls',
            'Trade Balance',
            'Consumer Confidence',
            'Housing Starts'
        ];
        
        $country = $this->faker->randomElement($countries);
        $eventType = $this->faker->randomElement($eventTypes);
        $eventDate = $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d');
        $eventTime = $this->faker->time('H:i:s');
        
        return [
            'event_id' => Str::uuid()->toString(),
            'title' => $country . ' ' . $eventType,
            'country' => $country,
            'event_date' => $eventDate,
            'event_time' => $eventTime,
            'impact' => $this->faker->randomElement($impacts),
            'forecast' => $this->faker->randomFloat(2, -10, 10) . '%',
            'previous' => $this->faker->randomFloat(2, -10, 10) . '%',
        ];
    }
}
