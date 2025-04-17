<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceAlert extends Model
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
        'condition',
        'price',
        'percent_change',
        'is_triggered',
        'triggered_at',
        'is_recurring',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'float',
        'percent_change' => 'float',
        'is_triggered' => 'boolean',
        'triggered_at' => 'datetime',
        'is_recurring' => 'boolean',
    ];

    /**
     * Get the user that owns the price alert.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
