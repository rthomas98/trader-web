<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletService
{
    /**
     * Create a new wallet for a user.
     *
     * @param User $user
     * @param array|string $currency
     * @param string|null $currencyType
     * @param bool|null $isDefault
     * @param float|null $initialBalance
     * @return Wallet
     */
    public function createWallet(
        User $user, 
        $currency, 
        string $currencyType = null, 
        bool $isDefault = false, 
        float $initialBalance = 0
    ): Wallet {
        // If first parameter is an array, use the old method signature
        if (is_array($currency)) {
            return $this->createWalletFromArray($user, $currency);
        }
        
        // Otherwise use the new signature
        return DB::transaction(function () use ($user, $currency, $currencyType, $isDefault, $initialBalance) {
            // Check if this is the first wallet for the user
            $isFirstWallet = $user->wallets()->count() === 0;
            
            // Create the wallet
            $wallet = new Wallet([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'currency' => $currency,
                'currency_type' => $currencyType ?? 'FIAT',
                'balance' => $initialBalance,
                'available_balance' => $initialBalance,
                'locked_balance' => 0,
                'is_default' => $isFirstWallet || $isDefault,
            ]);
            
            $wallet->save();
            
            // If this wallet is set as default, update other wallets
            if ($wallet->is_default) {
                $user->wallets()
                    ->where('id', '!=', $wallet->id)
                    ->update(['is_default' => false]);
            }
            
            // Create initial deposit transaction if balance is greater than 0
            if ($wallet->balance > 0) {
                $this->createTransaction($wallet, [
                    'transaction_type' => 'DEPOSIT',
                    'status' => 'COMPLETED',
                    'amount' => $wallet->balance,
                    'fee' => 0,
                    'description' => 'Initial wallet funding',
                ]);
            }
            
            return $wallet;
        });
    }
    
    /**
     * Create a new wallet for a user from array data.
     * 
     * @param User $user
     * @param array $walletData
     * @return Wallet
     */
    protected function createWalletFromArray(User $user, array $walletData): Wallet
    {
        return DB::transaction(function () use ($user, $walletData) {
            // Check if this is the first wallet for the user
            $isFirstWallet = $user->wallets()->count() === 0;
            
            // Create the wallet
            $wallet = new Wallet([
                'id' => $walletData['id'] ?? Str::uuid(),
                'user_id' => $user->id,
                'currency' => $walletData['currency'],
                'currency_type' => $walletData['currency_type'],
                'balance' => $walletData['balance'] ?? 0,
                'available_balance' => $walletData['balance'] ?? 0,
                'locked_balance' => 0,
                'is_default' => $isFirstWallet || ($walletData['is_default'] ?? false),
            ]);
            
            $wallet->save();
            
            // If this wallet is set as default, update other wallets
            if ($wallet->is_default) {
                $user->wallets()
                    ->where('id', '!=', $wallet->id)
                    ->update(['is_default' => false]);
            }
            
            // Create initial deposit transaction if balance is greater than 0
            if ($wallet->balance > 0) {
                $this->createTransaction($wallet, [
                    'transaction_type' => 'DEPOSIT',
                    'status' => 'COMPLETED',
                    'amount' => $wallet->balance,
                    'fee' => 0,
                    'description' => 'Initial wallet funding',
                ]);
            }
            
            return $wallet;
        });
    }
    
    /**
     * Deposit funds into a wallet.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @param float $fee
     * @param string $description
     * @param array $metadata
     * @param string $referenceId
     * @return WalletTransaction
     */
    public function deposit(
        Wallet $wallet,
        float $amount,
        float $fee = 0,
        string $description = 'Deposit',
        array $metadata = [],
        string $referenceId = null
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $fee, $description, $metadata, $referenceId) {
            // Update wallet balance
            $wallet->balance += $amount;
            $wallet->available_balance += $amount;
            $wallet->save();
            
            // Create transaction
            return $this->createTransaction($wallet, [
                'transaction_type' => 'DEPOSIT',
                'status' => 'COMPLETED',
                'amount' => $amount,
                'fee' => $fee,
                'description' => $description,
                'metadata' => $metadata,
                'reference_id' => $referenceId,
            ]);
        });
    }
    
    /**
     * Withdraw funds from a wallet.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @param float $fee
     * @param string $description
     * @param array $metadata
     * @param string $referenceId
     * @return WalletTransaction
     */
    public function withdraw(
        Wallet $wallet,
        float $amount,
        float $fee = 0,
        string $description = 'Withdrawal',
        array $metadata = [],
        string $referenceId = null
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $fee, $description, $metadata, $referenceId) {
            $totalAmount = $amount + $fee;
            
            // Check if sufficient funds are available
            if ($wallet->available_balance < $totalAmount) {
                throw new \Exception('Insufficient funds available for withdrawal.');
            }
            
            // Update wallet balance
            $wallet->balance -= $totalAmount;
            $wallet->available_balance -= $totalAmount;
            $wallet->save();
            
            // Create transaction
            return $this->createTransaction($wallet, [
                'transaction_type' => 'WITHDRAWAL',
                'status' => 'COMPLETED',
                'amount' => -$amount,
                'fee' => $fee,
                'description' => $description,
                'metadata' => $metadata,
                'reference_id' => $referenceId,
            ]);
        });
    }
    
    /**
     * Transfer funds between wallets.
     *
     * @param Wallet $fromWallet
     * @param Wallet $toWallet
     * @param float $amount
     * @param float $fee
     * @param string $description
     * @return array
     */
    public function transfer(
        Wallet $fromWallet,
        Wallet $toWallet,
        float $amount,
        float $fee = 0,
        string $description = 'Transfer'
    ): array {
        return DB::transaction(function () use ($fromWallet, $toWallet, $amount, $fee, $description) {
            $totalAmount = $amount + $fee;
            
            // Check if sufficient funds are available
            if ($fromWallet->available_balance < $totalAmount) {
                throw new \Exception('Insufficient funds available for transfer.');
            }
            
            // Generate a reference ID for linking the transactions
            $referenceId = uniqid('TRANSFER-');
            
            // Update source wallet balance
            $fromWallet->balance -= $totalAmount;
            $fromWallet->available_balance -= $totalAmount;
            $fromWallet->save();
            
            // Create outgoing transaction
            $outgoingTransaction = $this->createTransaction($fromWallet, [
                'transaction_type' => 'TRANSFER_OUT',
                'status' => 'COMPLETED',
                'amount' => -$amount,
                'fee' => $fee,
                'description' => $description,
                'metadata' => [
                    'to_wallet_id' => $toWallet->id,
                    'to_currency' => $toWallet->currency,
                ],
                'reference_id' => $referenceId,
            ]);
            
            // Update destination wallet balance
            $toWallet->balance += $amount;
            $toWallet->available_balance += $amount;
            $toWallet->save();
            
            // Create incoming transaction
            $incomingTransaction = $this->createTransaction($toWallet, [
                'transaction_type' => 'TRANSFER_IN',
                'status' => 'COMPLETED',
                'amount' => $amount,
                'fee' => 0,
                'description' => $description,
                'metadata' => [
                    'from_wallet_id' => $fromWallet->id,
                    'from_currency' => $fromWallet->currency,
                ],
                'reference_id' => $referenceId,
            ]);
            
            return [
                'success' => true,
                'outgoing_transaction' => $outgoingTransaction,
                'incoming_transaction' => $incomingTransaction,
                'message' => 'Transfer completed successfully.',
            ];
        });
    }
    
    /**
     * Lock funds in a wallet.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @param string $reason
     * @param string $referenceId
     * @return Wallet
     */
    public function lockFunds(
        Wallet $wallet,
        float $amount,
        string $reason = 'Trading margin',
        string $referenceId = null
    ): Wallet {
        return DB::transaction(function () use ($wallet, $amount, $reason, $referenceId) {
            // Check if sufficient funds are available
            if ($wallet->available_balance < $amount) {
                throw new \Exception('Insufficient funds available to lock.');
            }
            
            // Update wallet balance
            $wallet->available_balance -= $amount;
            $wallet->locked_balance += $amount;
            $wallet->save();
            
            // Create transaction
            $this->createTransaction($wallet, [
                'transaction_type' => 'LOCK',
                'status' => 'COMPLETED',
                'amount' => $amount,
                'fee' => 0,
                'description' => "Funds locked: {$reason}",
                'metadata' => [
                    'reason' => $reason,
                ],
                'reference_id' => $referenceId,
            ]);
            
            return $wallet;
        });
    }
    
    /**
     * Unlock funds in a wallet.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @param string $reason
     * @param string $referenceId
     * @return Wallet
     */
    public function unlockFunds(
        Wallet $wallet,
        float $amount,
        string $reason = 'Trading margin released',
        string $referenceId = null
    ): Wallet {
        return DB::transaction(function () use ($wallet, $amount, $reason, $referenceId) {
            // Check if sufficient funds are locked
            if ($wallet->locked_balance < $amount) {
                throw new \Exception('Insufficient locked funds to unlock.');
            }
            
            // Update wallet balance
            $wallet->available_balance += $amount;
            $wallet->locked_balance -= $amount;
            $wallet->save();
            
            // Create transaction
            $this->createTransaction($wallet, [
                'transaction_type' => 'UNLOCK',
                'status' => 'COMPLETED',
                'amount' => $amount,
                'fee' => 0,
                'description' => "Funds unlocked: {$reason}",
                'metadata' => [
                    'reason' => $reason,
                ],
                'reference_id' => $referenceId,
            ]);
            
            return $wallet;
        });
    }
    
    /**
     * Create a wallet transaction.
     *
     * @param Wallet $wallet
     * @param array $transactionData
     * @return WalletTransaction
     */
    protected function createTransaction(Wallet $wallet, array $transactionData): WalletTransaction
    {
        $transaction = new WalletTransaction(array_merge(
            [
                'wallet_id' => $wallet->id,
                'user_id' => $wallet->user_id,
            ],
            $transactionData
        ));
        
        $transaction->save();
        
        return $transaction;
    }
    
    /**
     * Get wallet balance summary for a user.
     *
     * @param User $user
     * @return array
     */
    public function getWalletSummary(User $user): array
    {
        $wallets = $user->wallets;
        
        $summary = [
            'total_balance' => 0,
            'total_available_balance' => 0,
            'total_locked_balance' => 0,
            'wallets' => [],
        ];
        
        foreach ($wallets as $wallet) {
            $summary['total_balance'] += $wallet->balance;
            $summary['total_available_balance'] += $wallet->available_balance;
            $summary['total_locked_balance'] += $wallet->locked_balance;
            
            $summary['wallets'][] = [
                'id' => $wallet->id,
                'currency' => $wallet->currency,
                'currency_type' => $wallet->currency_type,
                'balance' => $wallet->balance,
                'available_balance' => $wallet->available_balance,
                'locked_balance' => $wallet->locked_balance,
                'is_default' => $wallet->is_default,
            ];
        }
        
        return $summary;
    }
}
