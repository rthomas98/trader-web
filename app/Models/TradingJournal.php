<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TradingJournal extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'entry_type',
        'market_condition',
        'currency_pair',
        'timeframe',
        'entry_price',
        'stop_loss',
        'take_profit',
        'risk_reward_ratio',
        'position_size',
        'risk_percentage',
        'setup_notes',
        'entry_reason',
        'exit_reason',
        'lessons_learned',
        'indicators_used',
        'screenshots',
        'related_trade_id',
        'trade_outcome',
        'profit_loss',
        'profit_loss_percentage',
        'emotional_state',
        'trade_rating',
        'followed_plan',
        'is_favorite',
        'tags',
        'trade_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'entry_price' => 'decimal:5',
        'stop_loss' => 'decimal:5',
        'take_profit' => 'decimal:5',
        'risk_reward_ratio' => 'decimal:2',
        'position_size' => 'decimal:5',
        'risk_percentage' => 'decimal:2',
        'profit_loss' => 'decimal:2',
        'profit_loss_percentage' => 'decimal:2',
        'indicators_used' => 'array',
        'screenshots' => 'array',
        'tags' => 'array',
        'followed_plan' => 'boolean',
        'is_favorite' => 'boolean',
        'trade_date' => 'datetime',
    ];

    /**
     * Get the user that owns the journal entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the related trade position.
     */
    public function relatedTrade(): BelongsTo
    {
        return $this->belongsTo(TradingPosition::class, 'related_trade_id');
    }

    /**
     * Get the comments for the journal entry.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(JournalComment::class);
    }

    /**
     * Scope a query to only include entries of a specific type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('entry_type', $type);
    }

    /**
     * Scope a query to only include favorite entries.
     */
    public function scopeFavorites($query)
    {
        return $query->where('is_favorite', true);
    }

    /**
     * Scope a query to only include entries with specific outcome.
     */
    public function scopeWithOutcome($query, $outcome)
    {
        return $query->where('trade_outcome', $outcome);
    }

    /**
     * Scope a query to only include entries with specific tag.
     */
    public function scopeWithTag($query, $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }

    /**
     * Scope a query to only include entries for a specific currency pair.
     */
    public function scopeForPair($query, $pair)
    {
        return $query->where('currency_pair', $pair);
    }

    /**
     * Scope a query to only include entries for a specific time period.
     */
    public function scopeInPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('trade_date', [$startDate, $endDate]);
    }
}
