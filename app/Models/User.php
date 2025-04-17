<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Transaction;
use App\Models\Watchlist;
use App\Models\TradingJournal;
use App\Models\JournalComment;
use App\Models\TradingStrategy;
use App\Models\CopyTradingSettings;
use App\Models\PriceAlert;
use App\Models\NotificationPreference;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'account_balance',
        'available_margin',
        'leverage',
        'risk_percentage',
        'trading_account_type',
        'demo_mode_enabled',
        'max_drawdown_percentage',
        'risk_tolerance_level',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'account_balance' => 'decimal:2',
            'available_margin' => 'decimal:2',
            'leverage' => 'integer',
            'risk_percentage' => 'decimal:2',
            'max_drawdown_percentage' => 'decimal:2',
            'risk_tolerance_level' => 'string',
            'trading_account_type' => 'string',
            'demo_mode_enabled' => 'boolean',
        ];
    }

    /**
     * Get the wallets for the user.
     */
    public function wallets(): HasMany
    {
        return $this->hasMany(Wallet::class);
    }

    /**
     * Get the wallet transactions for the user.
     */
    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Get the connected accounts for the user.
     */
    public function connectedAccounts(): HasMany
    {
        return $this->hasMany(ConnectedAccount::class);
    }

    /**
     * Get the funding transactions for the user.
     */
    public function fundingTransactions(): HasMany
    {
        return $this->hasMany(FundingTransaction::class);
    }

    /**
     * Get the portfolio positions for the user.
     */
    public function portfolioPositions(): HasMany
    {
        return $this->hasMany(PortfolioPosition::class);
    }

    /**
     * Get the trading orders for the user.
     */
    public function tradingOrders(): HasMany
    {
        return $this->hasMany(TradingOrder::class);
    }

    /**
     * Get the trading positions for the user.
     */
    public function tradingPositions(): HasMany
    {
        return $this->hasMany(TradingPosition::class);
    }

    /**
     * Get the trading wallets for the user.
     */
    public function tradingWallets(): HasMany
    {
        return $this->hasMany(TradingWallet::class);
    }

    /**
     * Get the active trading wallet based on current mode (demo or live).
     */
    public function activeTradeWallet()
    {
        $type = $this->demo_mode_enabled ? 'DEMO' : 'LIVE';
        return $this->tradingWallets()->where('wallet_type', $type)->where('is_active', true)->first();
    }

    /**
     * Define the relationship with TradingWallet.
     */
    public function wallet(): HasMany
    {
        return $this->hasMany(TradingWallet::class);
    }

    /**
     * Define the relationship with Transaction.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the watchlist items for the user.
     */
    public function watchlists(): HasMany
    {
        return $this->hasMany(Watchlist::class);
    }

    /**
     * Get the trading journal entries for the user.
     */
    public function tradingJournals(): HasMany
    {
        return $this->hasMany(TradingJournal::class);
    }

    /**
     * Get the journal comments created by the user.
     */
    public function journalComments(): HasMany
    {
        return $this->hasMany(JournalComment::class);
    }

    /**
     * Get the trading strategies for the user.
     */
    public function strategies(): HasMany
    {
        return $this->hasMany(TradingStrategy::class);
    }

    /**
     * Get the trades for the user.
     */
    public function trades()
    {
        return $this->hasMany(Trade::class);
    }

    /**
     * The users that the current user follows.
     */
    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')
                    ->withTimestamps();
    }

    /**
     * The users that follow the current user.
     */
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')
                    ->withTimestamps();
    }

    /**
     * Get the copy trading relationships where this user is the copier.
     * (The traders this user is copying)
     */
    public function copying(): HasMany
    {
        return $this->hasMany(CopyTradingRelationship::class, 'copier_user_id');
    }

    /**
     * Get the copy trading relationships where this user is the trader being copied.
     * (The users copying this user)
     */
    public function copiers(): HasMany
    {
        return $this->hasMany(CopyTradingRelationship::class, 'trader_user_id');
    }

    /**
     * Get the copy trading settings for the user.
     */
    public function copyTradingSettings(): HasOne
    {
        return $this->hasOne(CopyTradingSettings::class);
    }
    
    /**
     * Get the notification preferences for the user.
     */
    public function notificationPreference(): HasOne
    {
        return $this->hasOne(NotificationPreference::class);
    }
    
    /**
     * Get the price alerts for the user.
     */
    public function priceAlerts(): HasMany
    {
        return $this->hasMany(PriceAlert::class);
    }
}
