<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class JournalEntry extends Model
{
    use HasFactory;

    /**
     * Create a new factory instance for the model.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    protected static function newFactory()
    {
        return \Database\Factories\JournalEntryFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'pair',
        'direction',
        'entry_price',
        'exit_price',
        'stop_loss',
        'take_profit',
        'risk_reward_ratio',
        'profit_loss',
        'outcome',
        'entry_at',
        'exit_at',
        'setup_reason',
        'execution_notes',
        'post_trade_analysis',
        'image_before',
        'image_after',
        'tags',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'entry_at' => 'datetime',
        'exit_at' => 'datetime',
        'tags' => 'array',
        'entry_price' => 'decimal:5',
        'exit_price' => 'decimal:5',
        'stop_loss' => 'decimal:5',
        'take_profit' => 'decimal:5',
        'risk_reward_ratio' => 'decimal:2',
        'profit_loss' => 'decimal:2',
    ];

    /**
     * Get the user that owns the journal entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
