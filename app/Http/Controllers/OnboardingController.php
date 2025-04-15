<?php

namespace App\Http\Controllers;

use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    /**
     * Show the onboarding page.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Check if user has already completed onboarding
        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }
        
        return Inertia::render('onboarding/index', [
            'user' => $user,
            'hasConnectedAccounts' => $user->connectedAccounts()->exists(),
        ]);
    }
    
    /**
     * Create a Plaid link token for account connection.
     */
    public function createLinkToken()
    {
        $user = Auth::user();
        
        // In a real app, these would be stored in .env
        $plaidClientId = config('services.plaid.client_id');
        $plaidSecret = config('services.plaid.secret');
        
        // Create a link token using Plaid API
        $response = Http::post('https://sandbox.plaid.com/link/token/create', [
            'client_id' => $plaidClientId,
            'secret' => $plaidSecret,
            'client_name' => 'Trading App',
            'user' => [
                'client_user_id' => (string) $user->id,
            ],
            'products' => ['auth', 'transactions'],
            'country_codes' => ['US'],
            'language' => 'en',
        ]);
        
        if (!$response->successful()) {
            return response()->json([
                'error' => 'Failed to create link token',
            ], 500);
        }
        
        return response()->json($response->json());
    }
    
    /**
     * Exchange public token for access token and store account info.
     */
    public function exchangeToken(Request $request)
    {
        $validated = $request->validate([
            'public_token' => 'required|string',
            'metadata' => 'required|array',
        ]);
        
        $user = Auth::user();
        $plaidClientId = config('services.plaid.client_id');
        $plaidSecret = config('services.plaid.secret');
        
        // Exchange public token for access token
        $response = Http::post('https://sandbox.plaid.com/item/public_token/exchange', [
            'client_id' => $plaidClientId,
            'secret' => $plaidSecret,
            'public_token' => $validated['public_token'],
        ]);
        
        if (!$response->successful()) {
            return response()->json([
                'error' => 'Failed to exchange token',
            ], 500);
        }
        
        $accessToken = $response->json('access_token');
        $itemId = $response->json('item_id');
        
        // Get account information
        $accountsResponse = Http::post('https://sandbox.plaid.com/accounts/get', [
            'client_id' => $plaidClientId,
            'secret' => $plaidSecret,
            'access_token' => $accessToken,
        ]);
        
        if (!$accountsResponse->successful()) {
            return response()->json([
                'error' => 'Failed to get account information',
            ], 500);
        }
        
        $accounts = $accountsResponse->json('accounts');
        $institution = $validated['metadata']['institution'];
        
        // Store each account
        foreach ($accounts as $account) {
            ConnectedAccount::create([
                'user_id' => $user->id,
                'institution_id' => $institution['institution_id'] ?? Str::uuid(),
                'institution_name' => $institution['name'] ?? 'Unknown Bank',
                'account_id' => $account['account_id'],
                'account_name' => $account['name'],
                'account_type' => $account['type'],
                'account_subtype' => $account['subtype'],
                'mask' => $account['mask'],
                'available_balance' => $account['balances']['available'] ?? 0,
                'current_balance' => $account['balances']['current'] ?? 0,
                'iso_currency_code' => $account['balances']['iso_currency_code'],
                'status' => 'ACTIVE',
                'is_verified' => true,
                'is_default' => !$user->connectedAccounts()->exists(), // First account is default
                'plaid_access_token' => $accessToken,
                'plaid_item_id' => $itemId,
                'metadata' => [
                    'institution' => $institution,
                ],
            ]);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Accounts connected successfully',
        ]);
    }
    
    /**
     * Complete the onboarding process.
     */
    public function complete()
    {
        $user = Auth::user();
        
        // Update user's onboarding status
        $user->onboarding_completed = true;
        $user->save();
        
        return redirect()->route('dashboard')
            ->with('success', 'Onboarding completed successfully!');
    }
    
    /**
     * Skip the onboarding process.
     */
    public function skip()
    {
        $user = Auth::user();
        
        // Update user's onboarding status
        $user->onboarding_completed = true;
        $user->save();
        
        return redirect()->route('dashboard')
            ->with('info', 'You can connect your accounts later from your profile settings.');
    }

    /**
     * Process a deposit during onboarding.
     */
    public function deposit(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:100',
        ]);
        
        $user = Auth::user();
        
        // In a real app, this would process the payment through a payment processor
        // For demo purposes, we'll just simulate a successful deposit
        
        // Update user's wallet balance
        if ($user->wallet) {
            $user->wallet->balance += $validated['amount'];
            $user->wallet->save();
        } else {
            // Create a wallet if it doesn't exist
            $user->wallet()->create([
                'balance' => $validated['amount'],
                'currency' => 'USD',
            ]);
        }
        
        // Record the transaction
        $user->transactions()->create([
            'type' => 'deposit',
            'amount' => $validated['amount'],
            'status' => 'completed',
            'description' => 'Initial deposit during onboarding',
            'metadata' => [
                'source' => 'onboarding',
            ],
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Deposit processed successfully',
            'balance' => $user->wallet->balance,
        ]);
    }
}
