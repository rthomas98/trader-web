<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\TradingWallet;

class TradingOrder extends Model
{
    use HasUuids, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'trading_wallet_id',
        'currency_pair',
        'order_type',
        'side',
        'quantity',
        'price',
        'stop_loss',
        'take_profit',
        'time_in_force',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'decimal:8',
        'price' => 'decimal:8',
        'stop_loss' => 'decimal:8',
        'take_profit' => 'decimal:8',
    ];

    /**
     * Get the user that owns the trading order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the trading wallet that owns the trading order.
     */
    public function tradingWallet(): BelongsTo
    {
        return $this->belongsTo(TradingWallet::class);
    }
}
