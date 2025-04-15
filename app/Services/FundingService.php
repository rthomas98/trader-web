<?php

namespace App\Services;

use App\Models\ConnectedAccount;
use App\Models\FundingTransaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;

class FundingService
{
    protected $walletService;

    /**
     * Create a new service instance.
     */
    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Initiate a deposit from a connected account to a wallet.
     *
     * @param User $user
     * @param ConnectedAccount $connectedAccount
     * @param Wallet $wallet
     * @param float $amount
     * @return array
     */
    public function initiateDeposit(
        User $user,
        ConnectedAccount $connectedAccount,
        Wallet $wallet,
        float $amount
    ): array {
        return DB::transaction(function () use ($user, $connectedAccount, $wallet, $amount) {
            // Check if connected account has sufficient funds
            if ($connectedAccount->available_balance < $amount) {
                throw new \Exception('Insufficient funds in connected account.');
            }
            
            // Create a funding transaction
            $fundingTransaction = new FundingTransaction([
                'user_id' => $user->id,
                'connected_account_id' => $connectedAccount->id,
                'transaction_type' => 'DEPOSIT',
                'amount' => $amount,
                'status' => 'PENDING',
                'reference_id' => uniqid('DEP-'),
            ]);
            
            $fundingTransaction->save();
            
            // In a real application, this would initiate an ACH transfer or similar
            // For demo purposes, we'll simulate the process
            
            // Update connected account balance
            $connectedAccount->available_balance -= $amount;
            $connectedAccount->save();
            
            return [
                'success' => true,
                'transaction' => $fundingTransaction,
                'message' => 'Deposit initiated successfully. Funds will be available in 1-3 business days.',
            ];
        });
    }
    
    /**
     * Complete a deposit transaction.
     *
     * @param FundingTransaction $transaction
     * @return array
     */
    public function completeDeposit(FundingTransaction $transaction): array
    {
        return DB::transaction(function () use ($transaction) {
            // Check if transaction is already completed
            if ($transaction->status !== 'PENDING') {
                throw new \Exception('Transaction is not in pending status.');
            }
            
            // Get the user's wallet
            $wallet = Wallet::where('user_id', $transaction->user_id)
                ->where('is_default', true)
                ->first();
                
            if (!$wallet) {
                throw new \Exception('Default wallet not found for user.');
            }
            
            // Update the wallet balance
            $walletTransaction = $this->walletService->deposit(
                $wallet,
                $transaction->amount,
                0,
                'Deposit from connected account',
                [
                    'funding_transaction_id' => $transaction->id,
                    'connected_account_id' => $transaction->connected_account_id,
                ],
                $transaction->reference_id
            );
            
            // Update the funding transaction status
            $transaction->status = 'COMPLETED';
            $transaction->save();
            
            return [
                'success' => true,
                'funding_transaction' => $transaction,
                'wallet_transaction' => $walletTransaction,
                'message' => 'Deposit completed successfully.',
            ];
        });
    }
    
    /**
     * Complete a transaction (deposit or withdrawal).
     *
     * @param FundingTransaction $transaction
     * @return array
     */
    public function completeTransaction(FundingTransaction $transaction): array
    {
        if ($transaction->transaction_type === 'DEPOSIT') {
            return $this->completeDeposit($transaction);
        } elseif ($transaction->transaction_type === 'WITHDRAWAL') {
            return $this->completeWithdrawal($transaction);
        } else {
            throw new \Exception('Unknown transaction type.');
        }
    }
    
    /**
     * Initiate a withdrawal from a wallet to a connected account.
     *
     * @param User $user
     * @param Wallet $wallet
     * @param ConnectedAccount $connectedAccount
     * @param float $amount
     * @param string $description
     * @return array
     */
    public function initiateWithdrawal(
        User $user,
        Wallet $wallet,
        ConnectedAccount $connectedAccount,
        float $amount,
        string $description = ''
    ): array {
        return DB::transaction(function () use ($user, $wallet, $connectedAccount, $amount, $description) {
            // Check if wallet has sufficient funds
            if ($wallet->available_balance < $amount) {
                throw new \Exception('Insufficient funds in wallet.');
            }
            
            // Create a funding transaction
            $fundingTransaction = new FundingTransaction([
                'user_id' => $user->id,
                'connected_account_id' => $connectedAccount->id,
                'transaction_type' => 'WITHDRAWAL',
                'amount' => $amount,
                'status' => 'PENDING',
                'reference_id' => uniqid('WDR-'),
                'description' => $description,
            ]);
            
            $fundingTransaction->save();
            
            // Update wallet balance
            $this->walletService->withdraw(
                $wallet,
                $amount,
                0,
                'Withdrawal to connected account',
                [
                    'funding_transaction_id' => $fundingTransaction->id,
                    'connected_account_id' => $connectedAccount->id,
                ],
                $fundingTransaction->reference_id
            );
            
            return [
                'success' => true,
                'transaction' => $fundingTransaction,
                'message' => 'Withdrawal initiated successfully. Funds will be available in your bank account in 1-3 business days.',
            ];
        });
    }
    
    /**
     * Complete a withdrawal transaction.
     *
     * @param FundingTransaction $transaction
     * @return array
     */
    public function completeWithdrawal(FundingTransaction $transaction): array
    {
        return DB::transaction(function () use ($transaction) {
            // Check if transaction is already completed
            if ($transaction->status !== 'PENDING') {
                throw new \Exception('Transaction is not in pending status.');
            }
            
            // Get the connected account
            $connectedAccount = $transaction->connectedAccount;
            
            // Update the connected account balance
            $connectedAccount->available_balance += $transaction->amount;
            $connectedAccount->current_balance += $transaction->amount;
            $connectedAccount->save();
            
            // Update the funding transaction status
            $transaction->status = 'COMPLETED';
            $transaction->save();
            
            return [
                'success' => true,
                'transaction' => $transaction,
                'message' => 'Withdrawal completed successfully.',
            ];
        });
    }
    
    /**
     * Cancel a pending transaction.
     *
     * @param FundingTransaction $transaction
     * @return array
     */
    public function cancelTransaction(FundingTransaction $transaction): array
    {
        return DB::transaction(function () use ($transaction) {
            // Check if transaction is pending
            if ($transaction->status !== 'PENDING') {
                throw new \Exception('Only pending transactions can be canceled.');
            }
            
            // If it's a withdrawal, refund the wallet
            if ($transaction->transaction_type === 'WITHDRAWAL') {
                $wallet = Wallet::where('user_id', $transaction->user_id)
                    ->where('is_default', true)
                    ->first();
                    
                if ($wallet) {
                    $this->walletService->deposit(
                        $wallet,
                        $transaction->amount,
                        0,
                        'Refund for canceled withdrawal',
                        [
                            'funding_transaction_id' => $transaction->id,
                            'connected_account_id' => $transaction->connected_account_id,
                        ],
                        'REFUND-' . $transaction->reference_id
                    );
                }
            }
            
            // If it's a deposit, refund the connected account
            if ($transaction->transaction_type === 'DEPOSIT') {
                $connectedAccount = $transaction->connectedAccount;
                $connectedAccount->available_balance += $transaction->amount;
                $connectedAccount->save();
            }
            
            // Update transaction status
            $transaction->status = 'CANCELED';
            $transaction->save();
            
            return [
                'success' => true,
                'transaction' => $transaction,
                'message' => 'Transaction canceled successfully.',
            ];
        });
    }
    
    /**
     * Get transaction history for a user.
     *
     * @param User $user
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getTransactionHistory(User $user, int $limit = 10, int $offset = 0): array
    {
        $transactions = FundingTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();
            
        $total = FundingTransaction::where('user_id', $user->id)->count();
        
        return [
            'transactions' => $transactions,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ];
    }
}
