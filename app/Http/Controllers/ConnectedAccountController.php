<?php

namespace App\Http\Controllers;

use App\Models\ConnectedAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ConnectedAccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $connectedAccounts = Auth::user()->connectedAccounts()->with('fundingTransactions')->get();
        
        return Inertia::render('connected-accounts/index', [
            'connectedAccounts' => $connectedAccounts,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // List of supported institutions
        $institutions = [
            ['id' => 'plaid_inst_1', 'name' => 'Bank of America', 'logo' => 'bofa.png'],
            ['id' => 'plaid_inst_2', 'name' => 'Chase', 'logo' => 'chase.png'],
            ['id' => 'plaid_inst_3', 'name' => 'Wells Fargo', 'logo' => 'wellsfargo.png'],
            ['id' => 'plaid_inst_4', 'name' => 'Citibank', 'logo' => 'citi.png'],
            ['id' => 'plaid_inst_5', 'name' => 'Capital One', 'logo' => 'capitalone.png'],
        ];
        
        return Inertia::render('connected-accounts/create', [
            'institutions' => $institutions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'institution_id' => 'required|string',
            'institution_name' => 'required|string',
            'account_name' => 'required|string',
            'account_type' => 'required|string',
            'account_subtype' => 'nullable|string',
            'account_number_last4' => 'required|string|size:4',
            'routing_number' => 'nullable|string',
            'balance_available' => 'nullable|numeric',
            'balance_current' => 'required|numeric',
            'is_verified' => 'boolean',
        ]);

        $connectedAccount = new ConnectedAccount($validated);
        $connectedAccount->user_id = Auth::id();
        $connectedAccount->status = 'ACTIVE';
        $connectedAccount->save();

        return redirect()->route('connected-accounts.index')
            ->with('success', 'Account connected successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $connectedAccount = Auth::user()->connectedAccounts()
            ->with(['fundingTransactions' => function($query) {
                $query->orderBy('created_at', 'desc');
            }])
            ->findOrFail($id);
        
        return Inertia::render('connected-accounts/show', [
            'connectedAccount' => $connectedAccount,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $connectedAccount = Auth::user()->connectedAccounts()->findOrFail($id);
        
        return Inertia::render('connected-accounts/edit', [
            'connectedAccount' => $connectedAccount,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $connectedAccount = Auth::user()->connectedAccounts()->findOrFail($id);
        
        $validated = $request->validate([
            'account_name' => 'required|string',
            'is_verified' => 'boolean',
            'status' => 'required|in:ACTIVE,INACTIVE,PENDING_VERIFICATION',
        ]);

        $connectedAccount->update($validated);

        return redirect()->route('connected-accounts.index')
            ->with('success', 'Connected account updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $connectedAccount = Auth::user()->connectedAccounts()->findOrFail($id);
        
        // Check if there are any pending funding transactions
        $pendingTransactions = $connectedAccount->fundingTransactions()
            ->whereIn('status', ['PENDING', 'PROCESSING'])
            ->count();
            
        if ($pendingTransactions > 0) {
            return redirect()->route('connected-accounts.index')
                ->with('error', 'Cannot remove account with pending transactions.');
        }
        
        $connectedAccount->status = 'INACTIVE';
        $connectedAccount->save();

        return redirect()->route('connected-accounts.index')
            ->with('success', 'Connected account removed successfully.');
    }
    
    /**
     * Verify a connected account.
     */
    public function verify(Request $request, string $id)
    {
        $connectedAccount = Auth::user()->connectedAccounts()->findOrFail($id);
        
        $validated = $request->validate([
            'verification_code' => 'required|string',
        ]);
        
        // In a real application, this would verify the code with a third-party service
        // For now, we'll just mark it as verified
        
        $connectedAccount->is_verified = true;
        $connectedAccount->status = 'ACTIVE';
        $connectedAccount->save();
        
        return redirect()->route('connected-accounts.index')
            ->with('success', 'Account verified successfully.');
    }
    
    /**
     * Refresh account data from the institution.
     */
    public function refresh(string $id)
    {
        $connectedAccount = Auth::user()->connectedAccounts()->findOrFail($id);
        
        // In a real application, this would fetch updated data from a third-party service
        // For now, we'll just update the last_refresh timestamp
        
        $connectedAccount->last_refresh = now();
        $connectedAccount->save();
        
        return redirect()->route('connected-accounts.show', $connectedAccount->id)
            ->with('success', 'Account data refreshed successfully.');
    }
}
