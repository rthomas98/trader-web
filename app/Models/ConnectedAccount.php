<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConnectedAccount extends Model
{
    use HasUuids, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'institution_id',
        'institution_name',
        'account_id',
        'account_name',
        'account_type',
        'account_subtype',
        'mask',
        'available_balance',
        'current_balance',
        'iso_currency_code',
        'status',
        'is_verified',
        'is_default',
        'plaid_access_token',
        'plaid_item_id',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'available_balance' => 'decimal:8',
        'current_balance' => 'decimal:8',
        'is_verified' => 'boolean',
        'is_default' => 'boolean',
        'metadata' => 'json',
    ];

    /**
     * Get the user that owns the connected account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the funding transactions for the connected account.
     */
    public function fundingTransactions(): HasMany
    {
        return $this->hasMany(FundingTransaction::class);
    }
}
