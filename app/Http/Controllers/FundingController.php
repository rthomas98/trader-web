<?php

namespace App\Http\Controllers;

use App\Models\ConnectedAccount;
use App\Models\FundingTransaction;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\FundingService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FundingController extends Controller
{
    protected $fundingService;
    protected $walletService;
    
    /**
     * Create a new controller instance.
     */
    public function __construct(FundingService $fundingService, WalletService $walletService)
    {
        $this->fundingService = $fundingService;
        $this->walletService = $walletService;
    }
    
    /**
     * Display a listing of funding transactions.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $limit = $request->input('limit', 15); // Default limit to 15
        $page = $request->input('page', 1);
        $offset = ($page - 1) * $limit;
        
        // Pass limit and offset to the service method
        $transactions = $this->fundingService->getTransactionHistory($user, $limit, $offset);
        
        // Fetch user's wallets
        $wallets = $user->wallets()->get();
        
        // Fetch user's active connected accounts (assuming balance is available)
        // Note: Fetching real-time balances might require a service call
        $connectedAccounts = $user->connectedAccounts()
            ->where('status', 'ACTIVE')
            // ->with('balance') // Assuming a balance relationship or attribute exists
            ->get();
            
        return Inertia::render('funding/index', [
            'transactions' => $transactions,
            'wallets' => $wallets, 
            'connectedAccounts' => $connectedAccounts,
        ]);
    }
    
    /**
     * Show the form for creating a deposit transaction.
     */
    public function createDeposit(Request $request)
    {
        $user = Auth::user();
        $connectedAccounts = $user->connectedAccounts()
            ->where('status', 'ACTIVE')
            ->where('is_verified', true)
            ->get();
            
        $wallets = $user->wallets()
            ->where('currency_type', 'FIAT')
            ->get();
            
        return Inertia::render('funding/createDeposit', [
            'connectedAccounts' => $connectedAccounts,
            'wallets' => $wallets,
            'preSelectedWalletId' => $request->input('wallet_id'),
            'preSelectedConnectedAccountId' => $request->input('connected_account_id'),
        ]);
    }
    
    /**
     * Store a newly created deposit transaction.
     */
    public function storeDeposit(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'connected_account_id' => 'required|uuid|exists:connected_accounts,id',
            'wallet_id' => 'required|uuid|exists:wallets,id',
            'amount' => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
        ]);
        
        $connectedAccount = ConnectedAccount::findOrFail($validated['connected_account_id']);
        $wallet = Wallet::findOrFail($validated['wallet_id']);
        
        // Ensure connected account belongs to the authenticated user
        if ($connectedAccount->user_id !== $user->id) {
            return redirect()->back()
                ->with('error', 'Connected account not found.');
        }
        
        // Ensure wallet belongs to the authenticated user
        if ($wallet->user_id !== $user->id) {
            return redirect()->back()
                ->with('error', 'Wallet not found.');
        }
        
        try {
            $transaction = $this->fundingService->initiateDeposit(
                $user,
                $connectedAccount,
                $wallet,
                $validated['amount'],
                $validated['description'] ?? 'Deposit from ' . $connectedAccount->institution_name
            );
            
            return redirect()->route('funding.index')
                ->with('success', 'Deposit initiated successfully. It may take 1-3 business days to process.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to initiate deposit: ' . $e->getMessage());
        }
    }
    
    /**
     * Show the form for creating a withdrawal transaction.
     */
    public function createWithdrawal(Request $request)
    {
        $user = Auth::user();
        $connectedAccounts = $user->connectedAccounts()
            ->where('status', 'ACTIVE')
            ->where('is_verified', true)
            ->get();
            
        $wallets = $user->wallets()
            ->where('currency_type', 'FIAT')
            ->get();
            
        return Inertia::render('funding/createWithdrawal', [
            'connectedAccounts' => $connectedAccounts,
            'wallets' => $wallets,
            'preSelectedWalletId' => $request->input('wallet_id'),
            'preSelectedConnectedAccountId' => $request->input('connected_account_id'),
        ]);
    }
    
    /**
     * Store a newly created withdrawal transaction.
     */
    public function storeWithdrawal(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'connected_account_id' => 'required|uuid|exists:connected_accounts,id',
            'wallet_id' => 'required|uuid|exists:wallets,id',
            'amount' => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
        ]);
        
        $connectedAccount = ConnectedAccount::findOrFail($validated['connected_account_id']);
        $wallet = Wallet::findOrFail($validated['wallet_id']);
        
        // Ensure connected account belongs to the authenticated user
        if ($connectedAccount->user_id !== $user->id) {
            return redirect()->back()
                ->with('error', 'Connected account not found.');
        }
        
        // Ensure wallet belongs to the authenticated user
        if ($wallet->user_id !== $user->id) {
            return redirect()->back()
                ->with('error', 'Wallet not found.');
        }
        
        try {
            $transaction = $this->fundingService->initiateWithdrawal(
                $user,
                $wallet,
                $connectedAccount,
                $validated['amount'],
                $validated['description'] ?? 'Withdrawal to ' . $connectedAccount->institution_name
            );
            
            return redirect()->route('funding.index')
                ->with('success', 'Withdrawal initiated successfully. It may take 1-3 business days to process.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to initiate withdrawal: ' . $e->getMessage());
        }
    }
    
    /**
     * Display the specified funding transaction.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $transaction = $user->fundingTransactions()
            ->with(['connectedAccount', 'wallet']) // Eager load both relationships
            ->findOrFail($id);
            
        return Inertia::render('funding/show', [
            'transaction' => $transaction,
        ]);
    }
    
    /**
     * Cancel a pending funding transaction.
     */
    public function cancel(string $id)
    {
        $user = Auth::user();
        $transaction = $user->fundingTransactions()->findOrFail($id);
        
        try {
            $this->fundingService->cancelTransaction($user, $transaction);
            
            return redirect()->route('funding.index')
                ->with('success', 'Transaction cancelled successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to cancel transaction: ' . $e->getMessage());
        }
    }
    
    /**
     * Process a funding transaction (admin only).
     * In a real application, this would be handled by a background job or webhook.
     */
    public function process(string $id)
    {
        // In a real application, this would check if the user is an admin
        // For now, we'll just allow it for demonstration purposes
        
        $transaction = FundingTransaction::findOrFail($id);
        
        try {
            $this->fundingService->completeTransaction($transaction);
            
            return redirect()->back()
                ->with('success', 'Transaction processed successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to process transaction: ' . $e->getMessage());
        }
    }
    
    /**
     * API endpoint for handling deposits during onboarding.
     */
    public function deposit(Request $request)
    {
        try {
            // Get the authenticated user
            $user = Auth::user();
            
            if (!$user) {
                Log::error('Deposit attempt with no authenticated user');
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required',
                ], 401);
            }
            
            Log::info('Starting deposit process for user: ' . $user->id);
            
            // Validate the request
            $validated = $request->validate([
                'amount' => 'required|numeric|min:1',
                'connected_account_id' => 'nullable|string',
            ]);
            
            Log::info('Deposit request data: ' . json_encode($validated));
            
            // Get the connected account
            if (empty($validated['connected_account_id'])) {
                $connectedAccount = $user->connectedAccounts()
                    ->where('status', 'ACTIVE')
                    ->first();
            } else {
                $connectedAccount = ConnectedAccount::where('id', $validated['connected_account_id'])
                    ->where('user_id', $user->id)
                    ->first();
            }
            
            // If no connected account exists, create a placeholder one for onboarding
            if (!$connectedAccount) {
                Log::info('No connected account found, creating a placeholder for onboarding');
                
                $connectedAccount = new ConnectedAccount();
                $connectedAccount->id = (string) Str::uuid();
                $connectedAccount->user_id = $user->id;
                $connectedAccount->institution_id = 'onboarding-placeholder';
                $connectedAccount->institution_name = 'Placeholder Bank';
                $connectedAccount->account_id = 'onboarding-' . Str::random(10);
                $connectedAccount->account_name = 'Onboarding Account';
                $connectedAccount->account_type = 'depository';
                $connectedAccount->account_subtype = 'checking';
                $connectedAccount->mask = '0000';
                $connectedAccount->available_balance = 0;
                $connectedAccount->current_balance = 0;
                $connectedAccount->iso_currency_code = 'USD';
                $connectedAccount->status = 'ACTIVE';
                $connectedAccount->is_verified = true;
                $connectedAccount->is_default = true;
                $connectedAccount->metadata = [
                    'created_during_onboarding' => true,
                    'needs_update' => true
                ];
                $connectedAccount->save();
                
                Log::info('Created placeholder connected account: ' . $connectedAccount->id);
            }
            
            Log::info('Using connected account: ' . $connectedAccount->id);
            
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
                    Log::info('Creating new wallet for user: ' . $user->id);
                    
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
                    
                    Log::info('New wallet created with ID: ' . $wallet->id);
                }
                
                // Generate a unique reference ID
                $referenceId = 'DEP-' . strtoupper(substr(md5(uniqid()), 0, 10));
                
                // Create funding transaction
                Log::info('Creating funding transaction');
                
                $transaction = new FundingTransaction();
                $transaction->id = (string) Str::uuid();
                $transaction->user_id = $user->id;
                $transaction->connected_account_id = $connectedAccount->id;
                $transaction->transaction_type = 'DEPOSIT';
                $transaction->amount = $validated['amount'];
                $transaction->status = 'COMPLETED';
                $transaction->reference_id = $referenceId;
                $transaction->description = 'Initial deposit during onboarding';
                $transaction->save();
                
                Log::info('Funding transaction created with ID: ' . $transaction->id);
                
                // Update wallet balance
                Log::info('Updating wallet balance');
                $wallet->balance += $validated['amount'];
                $wallet->available_balance += $validated['amount'];
                $wallet->save();
                
                Log::info('Wallet balance updated. New balance: ' . $wallet->balance);
                
                // Create wallet transaction record
                Log::info('Creating wallet transaction');
                
                $walletTransaction = new WalletTransaction();
                $walletTransaction->id = (string) Str::uuid();
                $walletTransaction->wallet_id = $wallet->id;
                $walletTransaction->user_id = $user->id;
                $walletTransaction->transaction_type = 'DEPOSIT';
                $walletTransaction->amount = $validated['amount'];
                $walletTransaction->fee = 0;
                $walletTransaction->status = 'COMPLETED';
                $walletTransaction->description = 'Initial deposit during onboarding';
                $walletTransaction->reference_id = $referenceId;
                $walletTransaction->metadata = [
                    'funding_transaction_id' => $transaction->id,
                    'connected_account_id' => $connectedAccount->id,
                ];
                $walletTransaction->save();
                
                Log::info('Wallet transaction created with ID: ' . $walletTransaction->id);
                
                // Commit the transaction
                DB::commit();
                
                Log::info('Deposit process completed successfully');
                
                return response()->json([
                    'success' => true,
                    'message' => 'Deposit processed successfully.',
                    'transaction' => $transaction,
                    'wallet' => $wallet->refresh(),
                ]);
            } catch (\Exception $e) {
                // Roll back the transaction in case of an error
                DB::rollBack();
                
                Log::error('Error during deposit transaction: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
                
                throw $e;
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error during deposit: ' . json_encode($e->errors()));
            
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to process deposit: ' . $e->getMessage());
            Log::error('Exception trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to process deposit. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
    
    /**
     * Process a simplified deposit during onboarding.
     */
    public function simpleDeposit(Request $request)
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:1',
            ]);

            $amount = $validated['amount'];
            $user = auth()->user();
            
            // Log the start of the deposit process
            Log::info('Starting simplified deposit process for user: ' . $user->id . ' (' . $user->email . ')');
            Log::info('Deposit amount: ' . $amount);
            
            // Check if the user has a connected account
            $connectedAccount = ConnectedAccount::where('user_id', $user->id)->first();
            
            if (!$connectedAccount) {
                Log::info('No connected account found, creating one...');
                // Create a placeholder connected account
                $connectedAccount = new ConnectedAccount();
                $connectedAccount->id = (string) Str::uuid();
                $connectedAccount->user_id = $user->id;
                $connectedAccount->provider = 'PLACEHOLDER';
                $connectedAccount->provider_account_id = 'ONBOARDING-' . Str::random(8);
                $connectedAccount->status = 'ACTIVE';
                $connectedAccount->save();
                
                Log::info('Created connected account: ' . $connectedAccount->id);
            } else {
                Log::info('Using existing connected account: ' . $connectedAccount->id);
            }
            
            // Generate a unique reference ID for this transaction
            $referenceId = 'ONBOARD-' . strtoupper(Str::random(8));
            
            // Create wallet if it doesn't exist
            $wallet = Wallet::where('user_id', $user->id)->first();
            
            if (!$wallet) {
                Log::info('Creating new wallet...');
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
                
                Log::info('Created wallet: ' . $wallet->id);
            } else {
                Log::info('Using existing wallet: ' . $wallet->id);
            }
            
            Log::info('Creating funding transaction...');
            
            // Create funding transaction
            $transaction = new FundingTransaction();
            $transaction->id = (string) Str::uuid();
            $transaction->user_id = $user->id;
            $transaction->connected_account_id = $connectedAccount->id;
            
            // Only set wallet_id if the column exists
            if (Schema::hasColumn('funding_transactions', 'wallet_id')) {
                $transaction->wallet_id = $wallet->id;
                Log::info('Added wallet_id to transaction');
            } else {
                Log::info('Skipping wallet_id as column does not exist');
            }
            
            $transaction->transaction_type = 'DEPOSIT';
            $transaction->amount = $amount;
            $transaction->status = 'COMPLETED';
            $transaction->reference_id = $referenceId;
            
            // Only set description if the column exists
            if (Schema::hasColumn('funding_transactions', 'description')) {
                $transaction->description = 'Initial deposit during onboarding';
                Log::info('Added description to transaction');
            } else {
                Log::info('Skipping description as column does not exist');
            }
            
            // Log the transaction data before saving
            Log::info('Transaction data before save: ' . json_encode($transaction->toArray()));
            
            try {
                $transaction->save();
                Log::info('Transaction saved successfully');
                
                // Update wallet balance
                $wallet->balance += $amount;
                $wallet->save();
                Log::info('Updated wallet balance: ' . $wallet->balance);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Deposit processed successfully',
                    'transaction_id' => $transaction->id,
                    'amount' => $amount,
                    'wallet_balance' => $wallet->balance
                ]);
            } catch (\Exception $e) {
                Log::error('Error saving transaction: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to process deposit: ' . $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error during simplified deposit: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error during deposit: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
