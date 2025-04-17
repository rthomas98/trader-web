<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CopyTradingRelationship extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'copier_user_id',
        'trader_user_id',
        'status',
        'risk_allocation_percentage',
        'max_drawdown_percentage',
        'copy_fixed_size',
        'fixed_lot_size',
        'copy_stop_loss',
        'copy_take_profit',
        'started_at',
        'stopped_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'copy_fixed_size' => 'boolean',
        'copy_stop_loss' => 'boolean',
        'copy_take_profit' => 'boolean',
        'started_at' => 'datetime',
        'stopped_at' => 'datetime',
        'risk_allocation_percentage' => 'decimal:2',
        'max_drawdown_percentage' => 'decimal:2',
        'fixed_lot_size' => 'decimal:2',
    ];

    /**
     * Get the user who is copying (the copier).
     */
    public function copier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'copier_user_id');
    }

    /**
     * Get the user who is being copied (the trader).
     */
    public function trader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trader_user_id');
    }
}
