<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\TradingWallet;

class TradingPosition extends Model
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
        'trade_type',
        'entry_price',
        'stop_loss',
        'take_profit',
        'status',
        'entry_time',
        'exit_time',
        'exit_price',
        'profit_loss',
        'quantity',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'entry_price' => 'decimal:8',
        'stop_loss' => 'decimal:8',
        'take_profit' => 'decimal:8',
        'exit_price' => 'decimal:8',
        'profit_loss' => 'decimal:8',
        'quantity' => 'decimal:8',
        'entry_time' => 'datetime',
        'exit_time' => 'datetime',
    ];

    /**
     * Get the user that owns the trading position.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the trading wallet that owns the trading position.
     */
    public function tradingWallet(): BelongsTo
    {
        return $this->belongsTo(TradingWallet::class);
    }
}
