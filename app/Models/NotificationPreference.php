<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'price_alerts',
        'market_news',
        'trade_executed',
        'trade_closed',
        'stop_loss_hit',
        'take_profit_hit',
        'new_copier',
        'copier_stopped',
        'copy_request_received',
        'copy_request_approved',
        'copy_request_rejected',
        'profit_milestone',
        'loss_milestone',
        'win_streak',
        'drawdown_alert',
        'new_follower',
        'trader_new_trade',
        'trader_performance_update',
        'email_notifications',
        'push_notifications',
        'in_app_notifications',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price_alerts' => 'boolean',
        'market_news' => 'boolean',
        'trade_executed' => 'boolean',
        'trade_closed' => 'boolean',
        'stop_loss_hit' => 'boolean',
        'take_profit_hit' => 'boolean',
        'new_copier' => 'boolean',
        'copier_stopped' => 'boolean',
        'copy_request_received' => 'boolean',
        'copy_request_approved' => 'boolean',
        'copy_request_rejected' => 'boolean',
        'profit_milestone' => 'boolean',
        'loss_milestone' => 'boolean',
        'win_streak' => 'boolean',
        'drawdown_alert' => 'boolean',
        'new_follower' => 'boolean',
        'trader_new_trade' => 'boolean',
        'trader_performance_update' => 'boolean',
        'email_notifications' => 'boolean',
        'push_notifications' => 'boolean',
        'in_app_notifications' => 'boolean',
    ];

    /**
     * Get the user that owns the notification preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
