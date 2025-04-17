<?php

namespace Database\Seeders;

use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class NotificationPreferenceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users
        $users = User::all();
        
        foreach ($users as $user) {
            // Skip if user already has notification preferences
            if ($user->notificationPreference) {
                continue;
            }
            
            // Create default notification preferences
            NotificationPreference::create([
                'user_id' => $user->id,
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
            ]);
        }
    }
}
