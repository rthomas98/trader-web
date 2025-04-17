<?php

namespace Database\Factories;

use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\NotificationPreference>
 */
class NotificationPreferenceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = NotificationPreference::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'price_alerts' => true,
            'market_news' => true,
            'trade_executed' => true,
            'trade_closed' => true,
            'stop_loss_hit' => true,
            'take_profit_hit' => true,
            'new_copier' => true,
            'copier_stopped' => true,
            'copy_request_received' => true,
            'copy_request_approved' => true,
            'copy_request_rejected' => true,
            'profit_milestone' => true,
            'loss_milestone' => true,
            'win_streak' => true,
            'drawdown_alert' => true,
            'new_follower' => true,
            'trader_new_trade' => true,
            'trader_performance_update' => true,
            'email_notifications' => true,
            'push_notifications' => true,
            'in_app_notifications' => true,
        ];
    }
    
    /**
     * Configure the model to have minimal notifications enabled.
     *
     * @return static
     */
    public function minimal(): static
    {
        return $this->state(fn (array $attributes) => [
            'price_alerts' => false,
            'market_news' => false,
            'trade_executed' => true,
            'trade_closed' => true,
            'stop_loss_hit' => false,
            'take_profit_hit' => false,
            'new_copier' => false,
            'copier_stopped' => false,
            'copy_request_received' => true,
            'copy_request_approved' => true,
            'copy_request_rejected' => true,
            'profit_milestone' => false,
            'loss_milestone' => false,
            'win_streak' => false,
            'drawdown_alert' => false,
            'new_follower' => false,
            'trader_new_trade' => false,
            'trader_performance_update' => false,
            'email_notifications' => false,
            'push_notifications' => false,
            'in_app_notifications' => true,
        ]);
    }
    
    /**
     * Configure the model to have only email notifications enabled.
     *
     * @return static
     */
    public function emailOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_notifications' => true,
            'push_notifications' => false,
            'in_app_notifications' => false,
        ]);
    }
    
    /**
     * Configure the model to have only push notifications enabled.
     *
     * @return static
     */
    public function pushOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_notifications' => false,
            'push_notifications' => true,
            'in_app_notifications' => false,
        ]);
    }
}
