<?php

namespace App\Http\Controllers;

use App\Models\CopyTradingRelationship;
use App\Models\CopyTradingSettings;
use App\Models\Trade;
use App\Models\User;
use App\Notifications\CopyTradeBlockedNotification;
use App\Notifications\CopyTradeNotification;
use App\Notifications\CopyTradeRequestApprovedNotification;
use App\Notifications\CopyTradeRequestNotification;
use App\Notifications\CopyTradeRequestRejectedNotification;
use App\Notifications\NewCopierNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CopyTradingController extends Controller
{
    /**
     * Display a listing of the user's copy trading relationships.
     */
    public function index(Request $request): InertiaResponse
    {
        $user = Auth::user();
        
        // Get the copy trading relationships where the user is the copier
        $copyingRelationships = $user->copying()
            ->with('trader')
            ->orderByRaw("CASE 
                WHEN status = 'active' THEN 1 
                WHEN status = 'paused' THEN 2 
                WHEN status = 'stopped' THEN 3 
                ELSE 4 
            END")
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Get the copy trading relationships where the user is the trader
        $copierRelationships = $user->copiers()
            ->with('copier')
            ->orderByRaw("CASE 
                WHEN status = 'active' THEN 1 
                WHEN status = 'paused' THEN 2 
                WHEN status = 'stopped' THEN 3 
                ELSE 4 
            END")
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Calculate statistics
        $active = $copyingRelationships->where('status', 'active')->count();
        $paused = $copyingRelationships->where('status', 'paused')->count();
        $stopped = $copyingRelationships->where('status', 'stopped')->count();
        $total = $copyingRelationships->count();
        $followers = $copierRelationships->count();
        
        // Calculate additional metrics for enhanced dashboard
        $totalCopying = $active + $paused; // Only count active and paused relationships
        
        // Calculate total profit from copied trades
        $totalProfit = Trade::where('user_id', $user->id)
            ->whereNotNull('copied_from_trade_id') // Using scopeCopied logic
            ->whereNotNull('closed_at')
            ->sum('profit');
            
        // Calculate win rate for last 30 days
        $recentTrades = Trade::where('user_id', $user->id)
            ->whereNotNull('copied_from_trade_id') // Using scopeCopied logic
            ->whereNotNull('closed_at')
            ->where('closed_at', '>=', now()->subDays(30))
            ->get();
            
        $winRate = 0;
        if ($recentTrades->count() > 0) {
            $winningTrades = $recentTrades->where('profit', '>', 0)->count();
            $winRate = round(($winningTrades / $recentTrades->count()) * 100);
        }
        
        // Get total number of users copying this trader
        $totalCopiers = $copierRelationships->where('status', '!=', 'stopped')->count();
        
        // Set up breadcrumbs
        $breadcrumbs = [
            ['name' => 'Dashboard', 'href' => route('dashboard')],
            ['name' => 'Social Trading', 'href' => route('social.index')],
            ['name' => 'My Copy Trading', 'href' => route('copy-trading.index')],
        ];
        
        return Inertia::render('CopyTrading/Index', [
            'breadcrumbs' => $breadcrumbs,
            'copyingRelationships' => $copyingRelationships,
            'copierRelationships' => $copierRelationships,
            'stats' => [
                'active' => $active,
                'paused' => $paused,
                'stopped' => $stopped,
                'total' => $total,
                'followers' => $followers,
                'totalCopying' => $totalCopying,
                'totalProfit' => number_format($totalProfit, 2, '.', ''),
                'totalCopiers' => $totalCopiers,
                'winRate' => $winRate,
            ],
        ]);
    }

    /**
     * Start copying a trader.
     *
     * @param Request $request
     * @return RedirectResponse
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'trader_user_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([Auth::id()])], // Ensure user exists and is not self
            'risk_allocation_percentage' => ['required', 'numeric', 'min:0.01', 'max:100.00'],
            'max_drawdown_percentage' => ['nullable', 'numeric', 'min:0.01', 'max:100.00'],
            'copy_fixed_size' => ['required', 'boolean'],
            'fixed_lot_size' => ['nullable', 'required_if:copy_fixed_size,true', 'numeric', 'min:0.01'],
            'copy_stop_loss' => ['required', 'boolean'],
            'copy_take_profit' => ['required', 'boolean'],
        ]);

        $copier = Auth::user();
        $trader = User::findOrFail($validated['trader_user_id']); // Ensure trader exists

        // Check if already actively copying this trader
        $existing = CopyTradingRelationship::where('copier_user_id', $copier->id)
            ->where('trader_user_id', $trader->id)
            ->where('status', 'active')
            ->first();

        if ($existing) {
            // Optionally, handle this case differently, e.g., redirect with error
            // For now, we'll just prevent creating duplicates
            // Or maybe reactivate if stopped?
            return Redirect::back()->with('error', 'You are already actively copying this trader.');
        }

        // Check if the trader allows copy trading
        $settings = $trader->copyTradingSettings;
        
        // If settings don't exist, create with default (public)
        if (!$settings) {
            $settings = CopyTradingSettings::create([
                'user_id' => $trader->id,
                'privacy_level' => 'public',
                'auto_approve_followers' => true,
            ]);
        }
        
        // Check if the trader allows this user to copy based on privacy settings
        $approvalStatus = 'approved'; // Default for public traders
        $initialStatus = 'active';    // Default status
        
        switch ($settings->privacy_level) {
            case 'private':
                return Redirect::back()->with('error', 'This trader does not allow copy trading.');
                
            case 'followers_only':
                // Check if the user is following the trader
                $isFollowing = $trader->followers()->where('follower_id', Auth::id())->exists();
                if (!$isFollowing) {
                    return Redirect::back()->with('error', 'You need to follow this trader before you can copy their trades.');
                }
                // If auto-approve is off, set to pending
                if (!$settings->auto_approve_followers) {
                    $approvalStatus = 'pending';
                    $initialStatus = 'paused'; // Paused until approved
                }
                break;
                
            case 'approved_only':
                $approvalStatus = 'pending';
                $initialStatus = 'paused'; // Paused until approved
                break;
        }

        // Create the relationship
        $relationship = $copier->copying()->create([
            'trader_user_id' => $trader->id,
            'status' => $initialStatus,
            'approval_status' => $approvalStatus,
            'risk_allocation_percentage' => $validated['risk_allocation_percentage'],
            'max_drawdown_percentage' => $validated['max_drawdown_percentage'] ?? null,
            'copy_fixed_size' => $validated['copy_fixed_size'],
            'fixed_lot_size' => $validated['copy_fixed_size'] ? $validated['fixed_lot_size'] : null,
            'copy_stop_loss' => $validated['copy_stop_loss'],
            'copy_take_profit' => $validated['copy_take_profit'],
            'started_at' => now(),
        ]);
        
        // Load the trader relationship for the notification
        $relationship->load('trader');
        
        // Send notification to the copier
        $copier->notify(new CopyTradeNotification($relationship, null, 'started'));

        // Send notification to trader if they want to be notified
        if ($settings->notify_on_copy_request && $approvalStatus === 'pending') {
            // Send notification to trader about the pending request
            $trader->notify(new CopyTradeRequestNotification($relationship));
        }
        
        if ($approvalStatus === 'approved') {
            // Send notification to trader about new copier
            $trader->notify(new NewCopierNotification($relationship));
            
            return Redirect::route('copy-trading.index')->with('success', 'You are now copying trades from ' . $trader->name);
        } else {
            return Redirect::route('copy-trading.index')->with('info', 'Your copy trading request has been sent to ' . $trader->name . ' for approval.');
        }
    }
    
    /**
     * Update a copy trading relationship (pause/resume).
     *
     * @param Request $request
     * @param CopyTradingRelationship $relationship
     * @return RedirectResponse
     */
    public function update(Request $request, CopyTradingRelationship $relationship): RedirectResponse
    {
        // Ensure the authenticated user is the copier
        if ($relationship->copier_user_id !== Auth::id()) {
            return Redirect::back()->with('error', 'You are not authorized to update this relationship.');
        }
        
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'paused'])],
            'risk_allocation_percentage' => ['sometimes', 'numeric', 'min:0.01', 'max:100.00'],
            'max_drawdown_percentage' => ['sometimes', 'nullable', 'numeric', 'min:0.01', 'max:100.00'],
            'copy_fixed_size' => ['sometimes', 'boolean'],
            'fixed_lot_size' => ['sometimes', 'nullable', 'numeric', 'min:0.01'],
            'copy_stop_loss' => ['sometimes', 'boolean'],
            'copy_take_profit' => ['sometimes', 'boolean'],
        ]);
        
        // Get the old status before updating
        $oldStatus = $relationship->status;
        
        // Update the relationship
        $relationship->update($validated);
        
        // Load the trader relationship for the notification
        $relationship->load('trader');
        
        // Determine notification type based on status change
        $notificationType = null;
        if ($oldStatus !== $validated['status']) {
            $notificationType = $validated['status'] === 'active' ? 'resumed' : 'paused';
            
            // Send notification to the copier
            $copier = User::find($relationship->copier_user_id);
            if ($copier) {
                $copier->notify(new CopyTradeNotification($relationship, null, $notificationType));
            }
        }
        
        $actionText = $validated['status'] === 'active' ? 'resumed' : 'paused';
        $traderName = $relationship->trader->name ?? 'this trader';
        
        return Redirect::back()->with('success', "Successfully {$actionText} copying {$traderName}.");
    }
    
    /**
     * Stop copying a trader.
     *
     * @param CopyTradingRelationship $relationship
     * @return RedirectResponse
     */
    public function destroy(CopyTradingRelationship $relationship): RedirectResponse
    {
        // Ensure the authenticated user is the copier
        if ($relationship->copier_user_id !== Auth::id()) {
            return Redirect::back()->with('error', 'You are not authorized to stop this relationship.');
        }
        
        // Update the relationship status to stopped and set stopped_at timestamp
        $relationship->update([
            'status' => 'stopped',
            'stopped_at' => now(),
        ]);
        
        // Load the trader relationship for the notification
        $relationship->load('trader');
        
        // Send notification to the copier
        $copier = User::find($relationship->copier_user_id);
        if ($copier) {
            $copier->notify(new CopyTradeNotification($relationship, null, 'stopped'));
        }
        
        $traderName = $relationship->trader->name ?? 'this trader';
        
        return Redirect::back()->with('success', "Successfully stopped copying {$traderName}.");
    }
    
    /**
     * Reactivate a previously stopped copy trading relationship.
     *
     * @param CopyTradingRelationship $relationship
     * @return RedirectResponse
     */
    public function reactivate(CopyTradingRelationship $relationship): RedirectResponse
    {
        // Ensure the authenticated user is the copier
        if ($relationship->copier_user_id !== Auth::id()) {
            return Redirect::back()->with('error', 'You are not authorized to reactivate this relationship.');
        }
        
        // Ensure the relationship is currently stopped
        if ($relationship->status !== 'stopped') {
            return Redirect::back()->with('error', 'Only stopped relationships can be reactivated.');
        }
        
        // Update the relationship status to active and reset stopped_at timestamp
        $relationship->update([
            'status' => 'active',
            'stopped_at' => null,
            'started_at' => now(), // Reset the start date to now
        ]);
        
        // Load the trader relationship for the notification
        $relationship->load('trader');
        
        // Send notification to the copier
        $copier = User::find($relationship->copier_user_id);
        if ($copier) {
            $copier->notify(new CopyTradeNotification($relationship, null, 'resumed'));
        }
        
        $traderName = $relationship->trader->name ?? 'this trader';
        
        return Redirect::back()->with('success', "Successfully reactivated copying {$traderName}.");
    }
    
    /**
     * Get performance metrics for a copy trading relationship.
     *
     * @param Request $request
     * @param CopyTradingRelationship $relationship
     * @return InertiaResponse
     */
    public function getPerformance(Request $request, CopyTradingRelationship $relationship): InertiaResponse
    {
        // Ensure the authenticated user is the copier
        if ($relationship->copier_user_id !== Auth::id()) {
            abort(403, 'You are not authorized to view this relationship.');
        }
        
        // Load the trader
        $relationship->load('trader:id,name,email');
        
        // Set up breadcrumbs
        $breadcrumbs = [
            ['name' => 'Dashboard', 'href' => route('dashboard')],
            ['name' => 'Social Trading', 'href' => route('social.index')],
            ['name' => 'My Copy Trading', 'href' => route('copy-trading.index')],
            ['name' => 'Performance', 'href' => route('copy-trading.performance', $relationship->id)],
        ];
        
        // In a real application, we would fetch actual performance data here
        // For now, we'll generate some sample data
        $performanceData = $this->generateSamplePerformanceData($relationship);
        
        return Inertia::render('CopyTrading/Performance', [
            'breadcrumbs' => $breadcrumbs,
            'relationship' => $relationship,
            'performanceData' => $performanceData,
        ]);
    }
    
    /**
     * Generate sample performance data for a copy trading relationship.
     * In a real application, this would be replaced with actual data from the database.
     *
     * @param CopyTradingRelationship $relationship
     * @return array
     */
    private function generateSamplePerformanceData(CopyTradingRelationship $relationship): array
    {
        // Calculate days since relationship started
        $startDate = $relationship->started_at;
        $endDate = $relationship->stopped_at ?? now();
        $daysSinceStart = $startDate->diffInDays($endDate) + 1;
        
        // Generate sample trades data
        $trades = [];
        $totalProfit = 0;
        $winCount = 0;
        $lossCount = 0;
        
        // Generate between 5 and 20 trades
        $tradeCount = min($daysSinceStart, rand(5, 20));
        
        for ($i = 0; $i < $tradeCount; $i++) {
            $isWin = rand(0, 100) < 65; // 65% win rate
            $profit = $isWin ? rand(10, 100) / 10 : -1 * rand(5, 50) / 10;
            $totalProfit += $profit;
            
            if ($isWin) {
                $winCount++;
            } else {
                $lossCount++;
            }
            
            $trades[] = [
                'id' => $i + 1,
                'symbol' => ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'][rand(0, 4)],
                'type' => ['BUY', 'SELL'][rand(0, 1)],
                'entry_price' => round(rand(100, 150) / 100, 5),
                'exit_price' => round(rand(100, 150) / 100, 5),
                'lot_size' => round(rand(1, 10) / 10, 2),
                'profit' => $profit,
                'opened_at' => $startDate->copy()->addDays(rand(0, $daysSinceStart - 1))->format('Y-m-d H:i:s'),
                'closed_at' => $startDate->copy()->addDays(rand(0, $daysSinceStart - 1))->addHours(rand(1, 24))->format('Y-m-d H:i:s'),
            ];
        }
        
        // Sort trades by opened_at
        usort($trades, function ($a, $b) {
            return strtotime($a['opened_at']) - strtotime($b['opened_at']);
        });
        
        // Generate equity curve data
        $equityCurve = [];
        $equity = 1000; // Starting equity
        
        foreach ($trades as $index => $trade) {
            $equity += $trade['profit'];
            $timestamp = strtotime($trade['closed_at']) * 1000; // Convert to milliseconds for ApexCharts
            $equityCurve[] = [$timestamp, round($equity, 2)];
        }
        
        return [
            'summary' => [
                'total_trades' => count($trades),
                'winning_trades' => $winCount,
                'losing_trades' => $lossCount,
                'win_rate' => $tradeCount > 0 ? round(($winCount / $tradeCount) * 100, 2) : 0,
                'total_profit' => round($totalProfit, 2),
                'average_profit' => $tradeCount > 0 ? round($totalProfit / $tradeCount, 2) : 0,
                'profit_factor' => $lossCount > 0 ? round(($winCount / $lossCount), 2) : 0,
            ],
            'trades' => $trades,
            'equity_curve' => [
                'series' => [
                    [
                        'name' => 'Equity',
                        'data' => $equityCurve,
                    ],
                ],
            ],
        ];
    }
    
    /**
     * Display performance metrics for a specific copy trading relationship.
     *
     * @param CopyTradingRelationship $relationship
     * @return \Inertia\Response
     */
    public function performance(CopyTradingRelationship $relationship): \Inertia\Response
    {
        // Ensure the authenticated user is the copier
        if ($relationship->copier_user_id !== Auth::id()) {
            return Redirect::route('copy-trading.index')->with('error', 'You are not authorized to view this relationship.');
        }
        
        // Load the trader relationship
        $relationship->load('trader');
        
        // Get trades for this relationship
        $trades = Trade::where('user_id', Auth::id())
            ->where('copy_trading_relationship_id', $relationship->id)
            ->orderBy('closed_at', 'desc')
            ->get();
            
        // Calculate performance summary
        $winningTrades = $trades->where('profit', '>', 0);
        $losingTrades = $trades->where('profit', '<', 0);
        
        $totalTrades = $trades->count();
        $winningTradesCount = $winningTrades->count();
        $losingTradesCount = $losingTrades->count();
        
        $winRate = $totalTrades > 0 ? round(($winningTradesCount / $totalTrades) * 100, 2) : 0;
        $totalProfit = $trades->sum('profit');
        $averageProfit = $totalTrades > 0 ? $totalProfit / $totalTrades : 0;
        
        $grossProfit = $winningTrades->sum('profit');
        $grossLoss = abs($losingTrades->sum('profit'));
        $profitFactor = $grossLoss > 0 ? round($grossProfit / $grossLoss, 2) : ($grossProfit > 0 ? 999 : 0);
        
        // Prepare equity curve data
        $equityCurveData = [];
        $runningBalance = 0;
        
        foreach ($trades->sortBy('closed_at') as $trade) {
            $runningBalance += $trade->profit;
            $timestamp = strtotime($trade->closed_at) * 1000; // Convert to milliseconds for ApexCharts
            $equityCurveData[] = [$timestamp, round($runningBalance, 2)];
        }
        
        // Prepare performance data
        $performanceData = [
            'summary' => [
                'total_trades' => $totalTrades,
                'winning_trades' => $winningTradesCount,
                'losing_trades' => $losingTradesCount,
                'win_rate' => $winRate,
                'total_profit' => $totalProfit,
                'average_profit' => $averageProfit,
                'profit_factor' => $profitFactor,
            ],
            'trades' => $trades,
            'equity_curve' => [
                'series' => [
                    [
                        'name' => 'Balance',
                        'data' => $equityCurveData,
                    ],
                ],
            ],
        ];
        
        // Prepare breadcrumbs
        $breadcrumbs = [
            ['name' => 'Dashboard', 'href' => route('dashboard')],
            ['name' => 'Copy Trading', 'href' => route('copy-trading.index')],
            ['name' => 'Performance', 'href' => route('copy-trading.performance', $relationship->id)],
        ];
        
        return Inertia::render('CopyTrading/Performance', [
            'breadcrumbs' => $breadcrumbs,
            'relationship' => $relationship,
            'performanceData' => $performanceData,
        ]);
    }
    
    /**
     * Update the user's copy trading settings.
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'privacy_level' => 'required|in:public,followers_only,approved_only,private',
            'auto_approve_followers' => 'boolean',
            'notify_on_copy_request' => 'boolean',
            'copy_trading_bio' => 'nullable|string|max:500',
        ]);

        // Get or create settings
        $settings = Auth::user()->copyTradingSettings;
        if (!$settings) {
            $settings = new CopyTradingSettings(['user_id' => Auth::id()]);
        }
        
        // Update settings
        $settings->fill($validated);
        $settings->save();
        
        return Redirect::back()->with('success', 'Copy trading settings updated successfully.');
    }
    
    /**
     * Show the copy trading settings page.
     */
    public function settings(): Response
    {
        $user = Auth::user();
        $settings = $user->copyTradingSettings ?? new CopyTradingSettings([
            'user_id' => $user->id,
            'privacy_level' => 'public',
            'auto_approve_followers' => true,
            'notify_on_copy_request' => true,
        ]);
        
        // Get pending copy requests
        $pendingRequests = CopyTradingRelationship::where('trader_user_id', $user->id)
            ->where('approval_status', 'pending')
            ->with('copier')
            ->get();
            
        // Get active copiers
        $activeCopiers = CopyTradingRelationship::where('trader_user_id', $user->id)
            ->where('approval_status', 'approved')
            ->where('status', '!=', 'stopped')
            ->with('copier')
            ->get();
        
        return Inertia::render('CopyTrading/Settings', [
            'settings' => $settings,
            'pendingRequests' => $pendingRequests,
            'activeCopiers' => $activeCopiers,
            'stats' => [
                'totalCopiers' => $user->copiers()->where('approval_status', 'approved')->count(),
                'pendingRequests' => $pendingRequests->count(),
            ],
        ]);
    }
    
    /**
     * Approve a copy trading request.
     */
    public function approveRequest(CopyTradingRelationship $relationship): RedirectResponse
    {
        // Ensure the authenticated user is the trader
        if ($relationship->trader_user_id !== Auth::id()) {
            return Redirect::back()->with('error', 'You are not authorized to approve this request.');
        }
        
        // Update the relationship
        $relationship->approval_status = 'approved';
        $relationship->status = 'active'; // Activate the relationship
        $relationship->save();
        
        // Notify the copier
        $relationship->copier->notify(new CopyTradeRequestApprovedNotification($relationship));
        
        return Redirect::back()->with('success', 'Copy trading request approved.');
    }
    
    /**
     * Reject a copy trading request.
     */
    public function rejectRequest(CopyTradingRelationship $relationship): RedirectResponse
    {
        // Ensure the authenticated user is the trader
        if ($relationship->trader_user_id !== Auth::id()) {
            return Redirect::back()->with('error', 'You are not authorized to reject this request.');
        }
        
        // Update the relationship
        $relationship->approval_status = 'rejected';
        $relationship->status = 'stopped'; // Stop the relationship
        $relationship->stopped_at = now();
        $relationship->save();
        
        // Notify the copier
        $relationship->copier->notify(new CopyTradeRequestRejectedNotification($relationship));
        
        return Redirect::back()->with('success', 'Copy trading request rejected.');
    }
    
    /**
     * Block a user from copying trades.
     */
    public function blockCopier(CopyTradingRelationship $relationship): RedirectResponse
    {
        // Ensure the authenticated user is the trader
        if ($relationship->trader_user_id !== Auth::id()) {
            return Redirect::back()->with('error', 'You are not authorized to block this copier.');
        }
        
        // Update the relationship
        $relationship->approval_status = 'rejected';
        $relationship->status = 'stopped';
        $relationship->stopped_at = now();
        $relationship->save();
        
        // Notify the copier
        $relationship->copier->notify(new CopyTradeBlockedNotification($relationship));
        
        return Redirect::back()->with('success', 'User has been blocked from copying your trades.');
    }
    
    /**
     * Get top traders for the dashboard.
     */
    public function topTraders(): Response
    {
        // Get users with the highest number of copiers
        $topTradersByFollowers = User::withCount(['copiers' => function ($query) {
                $query->where('status', '!=', 'stopped');
            }])
            ->having('copiers_count', '>', 0)
            ->orderBy('copiers_count', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'email'])
            ->map(function ($user) {
                // Calculate win rate for each trader
                $totalTrades = Trade::where('user_id', $user->id)
                    ->whereNull('copied_from_trade_id') // Original trades only
                    ->whereNotNull('closed_at')
                    ->count();
                
                $winningTrades = Trade::where('user_id', $user->id)
                    ->whereNull('copied_from_trade_id') // Original trades only
                    ->whereNotNull('closed_at')
                    ->where('profit', '>', 0)
                    ->count();
                
                $winRate = $totalTrades > 0 ? round(($winningTrades / $totalTrades) * 100) : 0;
                
                // Calculate monthly return
                $startOfMonth = now()->startOfMonth();
                $monthlyProfit = Trade::where('user_id', $user->id)
                    ->whereNull('copied_from_trade_id')
                    ->whereNotNull('closed_at')
                    ->where('closed_at', '>=', $startOfMonth)
                    ->sum('profit');
                
                // Get number of trades
                $tradeCount = Trade::where('user_id', $user->id)
                    ->whereNull('copied_from_trade_id')
                    ->count();
                
                // Determine risk level based on stop loss usage
                $tradesWithStopLoss = Trade::where('user_id', $user->id)
                    ->whereNull('copied_from_trade_id')
                    ->whereNotNull('stop_loss')
                    ->count();
                
                $stopLossPercentage = $tradeCount > 0 ? ($tradesWithStopLoss / $tradeCount) * 100 : 0;
                
                $riskLevel = 'Medium';
                if ($stopLossPercentage >= 90) {
                    $riskLevel = 'Low';
                } elseif ($stopLossPercentage <= 50) {
                    $riskLevel = 'High';
                }
                
                // Determine trading strategy based on trade patterns
                $strategy = 'Mixed';
                $averageHoldingTime = Trade::where('user_id', $user->id)
                    ->whereNull('copied_from_trade_id')
                    ->whereNotNull('closed_at')
                    ->whereNotNull('opened_at')
                    ->get()
                    ->avg(function ($trade) {
                        return $trade->closed_at->diffInMinutes($trade->opened_at);
                    });
                
                if ($averageHoldingTime < 60) { // Less than 1 hour
                    $strategy = 'Scalping';
                } elseif ($averageHoldingTime < 1440) { // Less than 1 day
                    $strategy = 'Day Trading';
                } elseif ($averageHoldingTime < 10080) { // Less than 1 week
                    $strategy = 'Swing Trading';
                } else {
                    $strategy = 'Position Trading';
                }
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => "https://api.dicebear.com/9.x/initials/svg?seed={$user->name}",
                    'win_rate' => $winRate,
                    'followers' => $user->copiers_count,
                    'monthly_return' => $monthlyProfit > 0 ? '+' . number_format($monthlyProfit, 2) : number_format($monthlyProfit, 2),
                    'trades' => $tradeCount,
                    'strategy' => $strategy,
                    'risk' => $riskLevel,
                ];
            });
            
        // Get recent trades from all users
        $recentTrades = Trade::with('user')
            ->whereNull('copied_from_trade_id') // Original trades only
            ->whereNotNull('closed_at')
            ->orderBy('closed_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($trade) {
                return [
                    'trader' => $trade->user->name,
                    'trader_id' => $trade->user_id,
                    'pair' => $trade->symbol,
                    'type' => $trade->type,
                    'amount' => number_format($trade->lot_size, 2),
                    'profit' => $trade->profit > 0 ? '+$' . number_format($trade->profit, 2) : '-$' . number_format(abs($trade->profit), 2),
                    'timestamp' => $trade->closed_at->diffForHumans(),
                    'take_profit' => $trade->take_profit ? number_format($trade->take_profit, 5) : 'N/A',
                    'stop_loss' => $trade->stop_loss ? number_format($trade->stop_loss, 5) : 'N/A',
                ];
            });
            
        return Inertia::render('CopyTrading/TopTraders', [
            'topTraders' => $topTradersByFollowers,
            'recentTrades' => $recentTrades,
        ]);
    }
}
