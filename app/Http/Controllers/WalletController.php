<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletController extends Controller
{
    protected $walletService;
    
    /**
     * Create a new controller instance.
     */
    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $wallets = Auth::user()->wallets()->with('transactions')->get();
        $summary = $this->walletService->getWalletSummary(Auth::user());
        
        return Inertia::render('wallet/index', [
            'wallets' => $wallets,
            'summary' => $summary,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('wallet/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'currency' => 'required|string|max:10',
            'currency_type' => 'required|in:FIAT,CRYPTO',
            'balance' => 'required|numeric|min:0',
            'is_default' => 'boolean',
        ]);

        try {
            $wallet = $this->walletService->createWallet(Auth::user(), $validated);
            
            return redirect()->route('wallets.index')
                ->with('success', 'Wallet created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to create wallet: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $wallet = Auth::user()->wallets()->with('transactions')->findOrFail($id);
        
        return Inertia::render('wallet/show', [
            'wallet' => $wallet,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $wallet = Auth::user()->wallets()->findOrFail($id);
        
        return Inertia::render('wallet/edit', [
            'wallet' => $wallet,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $wallet = Auth::user()->wallets()->findOrFail($id);
        
        $validated = $request->validate([
            'currency' => 'required|string|max:10',
            'is_default' => 'boolean',
        ]);

        $wallet->update($validated);
        
        // If this wallet is set as default, update other wallets
        if ($validated['is_default'] ?? false) {
            Auth::user()->wallets()
                ->where('id', '!=', $wallet->id)
                ->update(['is_default' => false]);
        }

        return redirect()->route('wallets.index')
            ->with('success', 'Wallet updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $wallet = Auth::user()->wallets()->findOrFail($id);
        
        // Check if wallet has balance
        if ($wallet->balance > 0) {
            return redirect()->route('wallets.index')
                ->with('error', 'Cannot delete wallet with balance.');
        }
        
        $wallet->delete();

        return redirect()->route('wallets.index')
            ->with('success', 'Wallet deleted successfully.');
    }

    /**
     * Deposit funds to wallet.
     */
    public function deposit(Request $request, string $id)
    {
        $wallet = Auth::user()->wallets()->findOrFail($id);
        
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
        ]);

        try {
            $this->walletService->deposit(
                $wallet,
                $validated['amount'],
                0,
                $validated['description'] ?? 'Deposit'
            );

            return redirect()->route('wallets.show', $wallet->id)
                ->with('success', 'Deposit completed successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to deposit: ' . $e->getMessage());
        }
    }

    /**
     * Withdraw funds from wallet.
     */
    public function withdraw(Request $request, string $id)
    {
        $wallet = Auth::user()->wallets()->findOrFail($id);
        
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
        ]);

        try {
            $this->walletService->withdraw(
                $wallet,
                $validated['amount'],
                0,
                $validated['description'] ?? 'Withdrawal'
            );

            return redirect()->route('wallets.show', $wallet->id)
                ->with('success', 'Withdrawal completed successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to withdraw: ' . $e->getMessage());
        }
    }
    
    /**
     * Transfer funds between wallets.
     */
    public function transfer(Request $request)
    {
        $validated = $request->validate([
            'from_wallet_id' => 'required|uuid|exists:wallets,id',
            'to_wallet_id' => 'required|uuid|exists:wallets,id|different:from_wallet_id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
        ]);
        
        $fromWallet = Auth::user()->wallets()->findOrFail($validated['from_wallet_id']);
        $toWallet = Auth::user()->wallets()->findOrFail($validated['to_wallet_id']);
        
        try {
            $this->walletService->transfer(
                $fromWallet,
                $toWallet,
                $validated['amount'],
                0,
                $validated['description'] ?? 'Transfer between wallets'
            );
            
            return redirect()->route('wallets.index')
                ->with('success', 'Transfer completed successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to transfer: ' . $e->getMessage());
        }
    }
}
