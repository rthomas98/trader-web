<?php
// Simple test script for deposits

// Bootstrap Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Import models
use App\Models\ConnectedAccount;
use App\Models\FundingTransaction;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

// Function to log and output
function logOutput($message) {
    echo $message . "\n";
    Log::info($message);
}

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
    
    logOutput("Starting deposit process for user: {$user->id} ({$user->email})");
    
    // Create a connected account if none exists
    $connectedAccount = $user->connectedAccounts()->where('status', 'ACTIVE')->first();
    
    if (!$connectedAccount) {
        logOutput("No connected account found, creating one...");
        
        $connectedAccount = new ConnectedAccount();
        $connectedAccount->id = (string) Str::uuid();
        $connectedAccount->user_id = $user->id;
        $connectedAccount->institution_id = 'test-script-' . Str::random(8);
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
        
        logOutput("Created connected account: {$connectedAccount->id}");
    } else {
        logOutput("Using existing connected account: {$connectedAccount->id}");
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
            logOutput("Creating new wallet...");
            
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
            
            logOutput("Created wallet: {$wallet->id}");
        } else {
            logOutput("Using existing wallet: {$wallet->id}");
            logOutput("Current balance: {$wallet->balance}");
        }
        
        // Amount to deposit
        $amount = 100;
        
        // Generate a unique reference ID
        $referenceId = 'TEST-' . strtoupper(substr(md5(uniqid()), 0, 10));
        
        // Create funding transaction
        logOutput("Creating funding transaction...");
        
        $transaction = new FundingTransaction();
        $transaction->id = (string) Str::uuid();
        $transaction->user_id = $user->id;
        $transaction->connected_account_id = $connectedAccount->id;
        $transaction->wallet_id = $wallet->id;
        $transaction->transaction_type = 'DEPOSIT';
        $transaction->amount = $amount;
        $transaction->status = 'COMPLETED';
        $transaction->reference_id = $referenceId;
        $transaction->description = 'Test script deposit';
        
        // Debug the transaction data
        logOutput("Transaction data: " . json_encode($transaction->toArray()));
        
        $transaction->save();
        
        logOutput("Created funding transaction: {$transaction->id}");
        
        // Update wallet balance
        logOutput("Updating wallet balance...");
        $wallet->balance += $amount;
        $wallet->available_balance += $amount;
        $wallet->save();
        
        logOutput("Updated wallet balance. New balance: {$wallet->balance}");
        
        // Create wallet transaction record
        logOutput("Creating wallet transaction...");
        
        $walletTransaction = new WalletTransaction();
        $walletTransaction->id = (string) Str::uuid();
        $walletTransaction->wallet_id = $wallet->id;
        $walletTransaction->user_id = $user->id;
        $walletTransaction->transaction_type = 'DEPOSIT';
        $walletTransaction->amount = $amount;
        $walletTransaction->fee = 0;
        $walletTransaction->status = 'COMPLETED';
        $walletTransaction->description = 'Test script deposit';
        $walletTransaction->reference_id = $referenceId;
        $walletTransaction->metadata = [
            'funding_transaction_id' => $transaction->id,
            'connected_account_id' => $connectedAccount->id,
        ];
        
        // Debug the wallet transaction data
        logOutput("Wallet transaction data: " . json_encode($walletTransaction->toArray()));
        
        $walletTransaction->save();
        
        logOutput("Created wallet transaction: {$walletTransaction->id}");
        
        // Commit the transaction
        DB::commit();
        
        logOutput("Deposit process completed successfully");
        
        echo json_encode([
            'success' => true,
            'message' => 'Deposit processed successfully.',
            'transaction' => $transaction->toArray(),
            'wallet' => $wallet->refresh()->toArray(),
        ], JSON_PRETTY_PRINT);
        
    } catch (\Exception $e) {
        // Roll back the transaction in case of an error
        DB::rollBack();
        
        logOutput("Error during deposit transaction: {$e->getMessage()}");
        logOutput("Stack trace: {$e->getTraceAsString()}");
        
        echo json_encode([
            'success' => false,
            'message' => 'Error during deposit: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
    }
} catch (\Exception $e) {
    logOutput("Failed to process deposit: {$e->getMessage()}");
    logOutput("Exception trace: {$e->getTraceAsString()}");
    
    echo json_encode([
        'success' => false,
        'message' => 'Failed to process deposit: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ]);
}
