<?php

namespace App\Console\Commands;

use App\Models\ConnectedAccount;
use App\Models\FundingTransaction;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TestDeposit extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-deposit {user_id} {amount=100}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test deposit functionality for a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');
        $amount = $this->argument('amount');

        $this->info("Testing deposit of \${$amount} for user ID: {$userId}");

        try {
            // Find the user
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found");
                return 1;
            }

            $this->info("User found: {$user->name} ({$user->email})");

            // Find an active connected account
            $connectedAccount = $user->connectedAccounts()
                ->where('status', 'ACTIVE')
                ->first();

            if (!$connectedAccount) {
                $this->error("No active connected account found for user");
                return 1;
            }

            $this->info("Connected account found: {$connectedAccount->id}");

            // Start a database transaction
            DB::beginTransaction();

            try {
                // Get or create a default USD wallet
                $wallet = $user->wallets()
                    ->where('currency', 'USD')
                    ->where('currency_type', 'FIAT')
                    ->where('is_default', true)
                    ->first();

                if (!$wallet) {
                    $this->info("Creating new wallet for user");
                    
                    // Create a new wallet
                    $wallet = new Wallet();
                    $wallet->id = (string) Str::uuid();
                    $wallet->user_id = $user->id;
                    $wallet->currency = 'USD';
                    $wallet->currency_type = 'FIAT';
                    $wallet->balance = 0;
                    $wallet->available_balance = 0;
                    $wallet->locked_balance = 0;
                    $wallet->is_default = true;
                    $wallet->save();
                    
                    $this->info("New wallet created with ID: {$wallet->id}");
                } else {
                    $this->info("Existing wallet found with ID: {$wallet->id}");
                    $this->info("Current balance: {$wallet->balance}");
                }

                // Generate a unique reference ID
                $referenceId = 'TEST-DEP-' . strtoupper(substr(md5(uniqid()), 0, 10));
                
                // Create funding transaction
                $this->info("Creating funding transaction");
                
                $transaction = new FundingTransaction();
                $transaction->id = (string) Str::uuid();
                $transaction->user_id = $user->id;
                $transaction->connected_account_id = $connectedAccount->id;
                $transaction->wallet_id = $wallet->id;
                $transaction->transaction_type = 'DEPOSIT';
                $transaction->amount = $amount;
                $transaction->status = 'COMPLETED';
                $transaction->reference_id = $referenceId;
                $transaction->description = 'Test deposit from command line';
                
                // Debug the transaction data before saving
                $this->info("Transaction data: " . json_encode($transaction->toArray()));
                
                $transaction->save();
                
                $this->info("Funding transaction created with ID: {$transaction->id}");
                
                // Update wallet balance
                $this->info("Updating wallet balance");
                $wallet->balance += $amount;
                $wallet->available_balance += $amount;
                $wallet->save();
                
                $this->info("Wallet balance updated. New balance: {$wallet->balance}");
                
                // Create wallet transaction record
                $this->info("Creating wallet transaction");
                
                $walletTransaction = new WalletTransaction();
                $walletTransaction->id = (string) Str::uuid();
                $walletTransaction->wallet_id = $wallet->id;
                $walletTransaction->user_id = $user->id;
                $walletTransaction->transaction_type = 'DEPOSIT';
                $walletTransaction->amount = $amount;
                $walletTransaction->fee = 0;
                $walletTransaction->status = 'COMPLETED';
                $walletTransaction->description = 'Test deposit from command line';
                $walletTransaction->reference_id = $referenceId;
                $walletTransaction->metadata = [
                    'funding_transaction_id' => $transaction->id,
                    'connected_account_id' => $connectedAccount->id,
                ];
                
                // Debug the wallet transaction data before saving
                $this->info("Wallet transaction data: " . json_encode($walletTransaction->toArray()));
                
                $walletTransaction->save();
                
                $this->info("Wallet transaction created with ID: {$walletTransaction->id}");
                
                // Commit the transaction
                DB::commit();
                
                $this->info("Deposit process completed successfully");
                
                return 0;
            } catch (\Exception $e) {
                // Roll back the transaction in case of an error
                DB::rollBack();
                
                $this->error("Error during deposit transaction: {$e->getMessage()}");
                $this->error("Stack trace: {$e->getTraceAsString()}");
                
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("Failed to process deposit: {$e->getMessage()}");
            $this->error("Exception trace: {$e->getTraceAsString()}");
            
            return 1;
        }
    }
}
