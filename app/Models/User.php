<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

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
}
