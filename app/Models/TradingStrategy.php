<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradingStrategy extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'risk_level',
        'target_assets',
        'timeframe',
    ];

    /**
     * Get the user that owns the strategy.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
