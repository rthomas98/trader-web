<?php

namespace Database\Factories;

use App\Models\CopyTradingRelationship;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CopyTradingRelationship>
 */
class CopyTradingRelationshipFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = ['active', 'paused', 'stopped'];
        $copyFixedSize = $this->faker->boolean(30); // 30% chance of using fixed lot size

        return [
            'copier_user_id' => User::factory(),
            'trader_user_id' => User::factory(),
            'status' => $this->faker->randomElement($statuses),
            'risk_allocation_percentage' => $this->faker->randomFloat(2, 1, 100),
            'max_drawdown_percentage' => $this->faker->optional(70)->randomFloat(2, 1, 50), // 70% chance of having a max drawdown
            'copy_fixed_size' => $copyFixedSize,
            'fixed_lot_size' => $copyFixedSize ? $this->faker->randomFloat(2, 0.01, 10) : null,
            'copy_stop_loss' => $this->faker->boolean(80), // 80% chance of copying stop loss
            'copy_take_profit' => $this->faker->boolean(80), // 80% chance of copying take profit
            'started_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'stopped_at' => function (array $attributes) {
                // Only set stopped_at if status is 'stopped'
                return $attributes['status'] === 'stopped' 
                    ? $this->faker->dateTimeBetween($attributes['started_at'], 'now') 
                    : null;
            },
        ];
    }

    /**
     * Indicate that the relationship is active.
     */
    public function active(): self
    {
        return $this->state(function () {
            return [
                'status' => 'active',
                'stopped_at' => null,
            ];
        });
    }

    /**
     * Indicate that the relationship is paused.
     */
    public function paused(): self
    {
        return $this->state(function () {
            return [
                'status' => 'paused',
                'stopped_at' => null,
            ];
        });
    }

    /**
     * Indicate that the relationship is stopped.
     */
    public function stopped(): self
    {
        return $this->state(function () {
            return [
                'status' => 'stopped',
                'stopped_at' => $this->faker->dateTimeBetween('-3 months', 'now'),
            ];
        });
    }
}
