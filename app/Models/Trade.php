<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\CopyTradingRelationship;

class Trade extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'symbol',
        'type', // BUY or SELL
        'entry_price',
        'exit_price',
        'lot_size',
        'profit',
        'stop_loss',
        'take_profit',
        'opened_at',
        'closed_at',
        'copied_from_trade_id',
        'copy_trading_relationship_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'entry_price' => 'float',
        'exit_price' => 'float',
        'lot_size' => 'float',
        'profit' => 'float',
        'stop_loss' => 'float',
        'take_profit' => 'float',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the trade.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the original trade that this trade was copied from.
     */
    public function originalTrade(): BelongsTo
    {
        return $this->belongsTo(Trade::class, 'copied_from_trade_id');
    }

    /**
     * Get the copy trading relationship that this trade belongs to.
     */
    public function copyTradingRelationship(): BelongsTo
    {
        return $this->belongsTo(CopyTradingRelationship::class);
    }

    /**
     * Get all trades that were copied from this trade.
     */
    public function copiedTrades()
    {
        return $this->hasMany(Trade::class, 'copied_from_trade_id');
    }

    /**
     * Scope a query to only include trades for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to only include winning trades.
     */
    public function scopeWinning($query)
    {
        return $query->where('profit', '>', 0);
    }

    /**
     * Scope a query to only include losing trades.
     */
    public function scopeLosing($query)
    {
        return $query->where('profit', '<', 0);
    }

    /**
     * Scope a query to only include copied trades.
     */
    public function scopeCopied($query)
    {
        return $query->whereNotNull('copied_from_trade_id');
    }

    /**
     * Scope a query to only include original (not copied) trades.
     */
    public function scopeOriginal($query)
    {
        return $query->whereNull('copied_from_trade_id');
    }
}
