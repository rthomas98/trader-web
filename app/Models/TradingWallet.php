<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TradingWallet extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'wallet_type',
        'balance',
        'available_margin',
        'used_margin',
        'leverage',
        'risk_percentage',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'balance' => 'decimal:8',
        'available_margin' => 'decimal:8',
        'used_margin' => 'decimal:8',
        'leverage' => 'integer',
        'risk_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user that owns the trading wallet.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the trading positions for this wallet.
     */
    public function tradingPositions(): HasMany
    {
        return $this->hasMany(TradingPosition::class);
    }

    /**
     * Get the trading orders for this wallet.
     */
    public function tradingOrders(): HasMany
    {
        return $this->hasMany(TradingOrder::class);
    }
}
