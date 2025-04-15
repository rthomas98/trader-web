<?php

// This is a direct test script for the deposit functionality
// It bypasses the normal Laravel routing and middleware

require __DIR__ . '/../vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ConnectedAccount;
use App\Models\FundingTransaction;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

// Set up error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    // Get the first user
    $user = User::first();
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'No users found in the database',
        ]);
        exit;
    }
    
    echo "Starting deposit process for user: {$user->id} ({$user->email})\n";
    
    // Create a connected account if none exists
    $connectedAccount = $user->connectedAccounts()->where('status', 'ACTIVE')->first();
    
    if (!$connectedAccount) {
        echo "No connected account found, creating one...\n";
        
        $connectedAccount = new ConnectedAccount();
        $connectedAccount->id = (string) Str::uuid();
        $connectedAccount->user_id = $user->id;
        $connectedAccount->institution_id = 'direct-test-' . Str::random(8);
        $connectedAccount->institution_name = 'Test Bank';
        $connectedAccount->account_id = 'test-' . Str::random(10);
        $connectedAccount->account_name = 'Test Account';
        $connectedAccount->account_type = 'depository';
        $connectedAccount->account_subtype = 'checking';
        $connectedAccount->mask = '1234';
        $connectedAccount->available_balance = 1000;
        $connectedAccount->current_balance = 1000;
        $connectedAccount->iso_currency_code = 'USD';
        $connectedAccount->status = 'ACTIVE';
        $connectedAccount->is_verified = true;
        $connectedAccount->is_default = true;
        $connectedAccount->metadata = [
            'created_for_testing' => true,
        ];
        $connectedAccount->save();
        
        echo "Created connected account: {$connectedAccount->id}\n";
    } else {
        echo "Using existing connected account: {$connectedAccount->id}\n";
    }
    
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
            echo "Creating new wallet...\n";
            
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
            
            echo "Created wallet: {$wallet->id}\n";
        } else {
            echo "Using existing wallet: {$wallet->id}\n";
            echo "Current balance: {$wallet->balance}\n";
        }
        
        // Amount to deposit
        $amount = 100;
        
        // Generate a unique reference ID
        $referenceId = 'DIRECT-TEST-' . strtoupper(substr(md5(uniqid()), 0, 10));
        
        // Create funding transaction
        echo "Creating funding transaction...\n";
        
        $transaction = new FundingTransaction();
        $transaction->id = (string) Str::uuid();
        $transaction->user_id = $user->id;
        $transaction->connected_account_id = $connectedAccount->id;
        $transaction->wallet_id = $wallet->id;
        $transaction->transaction_type = 'DEPOSIT';
        $transaction->amount = $amount;
        $transaction->status = 'COMPLETED';
        $transaction->reference_id = $referenceId;
        $transaction->description = 'Direct test deposit';
        
        // Debug the transaction data
        echo "Transaction data: " . json_encode($transaction->toArray()) . "\n";
        
        $transaction->save();
        
        echo "Created funding transaction: {$transaction->id}\n";
        
        // Update wallet balance
        echo "Updating wallet balance...\n";
        $wallet->balance += $amount;
        $wallet->available_balance += $amount;
        $wallet->save();
        
        echo "Updated wallet balance. New balance: {$wallet->balance}\n";
        
        // Create wallet transaction record
        echo "Creating wallet transaction...\n";
        
        $walletTransaction = new WalletTransaction();
        $walletTransaction->id = (string) Str::uuid();
        $walletTransaction->wallet_id = $wallet->id;
        $walletTransaction->user_id = $user->id;
        $walletTransaction->transaction_type = 'DEPOSIT';
        $walletTransaction->amount = $amount;
        $walletTransaction->fee = 0;
        $walletTransaction->status = 'COMPLETED';
        $walletTransaction->description = 'Direct test deposit';
        $walletTransaction->reference_id = $referenceId;
        $walletTransaction->metadata = [
            'funding_transaction_id' => $transaction->id,
            'connected_account_id' => $connectedAccount->id,
        ];
        
        // Debug the wallet transaction data
        echo "Wallet transaction data: " . json_encode($walletTransaction->toArray()) . "\n";
        
        $walletTransaction->save();
        
        echo "Created wallet transaction: {$walletTransaction->id}\n";
        
        // Commit the transaction
        DB::commit();
        
        echo "Deposit process completed successfully\n";
        
        echo json_encode([
            'success' => true,
            'message' => 'Deposit processed successfully.',
            'transaction' => $transaction->toArray(),
            'wallet' => $wallet->refresh()->toArray(),
        ], JSON_PRETTY_PRINT);
        
    } catch (\Exception $e) {
        // Roll back the transaction in case of an error
        DB::rollBack();
        
        echo "Error during deposit transaction: {$e->getMessage()}\n";
        echo "Stack trace: {$e->getTraceAsString()}\n";
        
        echo json_encode([
            'success' => false,
            'message' => 'Error during deposit: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
    }
} catch (\Exception $e) {
    echo "Failed to process deposit: {$e->getMessage()}\n";
    echo "Exception trace: {$e->getTraceAsString()}\n";
    
    echo json_encode([
        'success' => false,
        'message' => 'Failed to process deposit: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ]);
}
