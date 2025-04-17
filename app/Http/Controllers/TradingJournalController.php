<?php

namespace App\Http\Controllers;

use App\Models\TradingJournal;
use App\Models\TradingPosition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class TradingJournalController extends Controller
{
    /**
     * Display a listing of the journal entries.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Get filter parameters
        $entryType = $request->input('entry_type');
        $outcome = $request->input('outcome');
        $pair = $request->input('pair');
        $tag = $request->input('tag');
        $favorites = $request->boolean('favorites');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $search = $request->input('search');
        
        // Build query
        $query = $user->tradingJournals();
        
        // Apply filters
        if ($entryType) {
            $query->ofType($entryType);
        }
        
        if ($outcome) {
            $query->withOutcome($outcome);
        }
        
        if ($pair) {
            $query->forPair($pair);
        }
        
        if ($tag) {
            $query->withTag($tag);
        }
        
        if ($favorites) {
            $query->favorites();
        }
        
        if ($startDate && $endDate) {
            $query->inPeriod($startDate, $endDate);
        }
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('setup_notes', 'like', "%{$search}%")
                  ->orWhere('entry_reason', 'like', "%{$search}%")
                  ->orWhere('exit_reason', 'like', "%{$search}%")
                  ->orWhere('lessons_learned', 'like', "%{$search}%");
            });
        }
        
        // Get journal entries with pagination
        $entries = $query->with(['relatedTrade', 'comments'])
                        ->orderBy('trade_date', 'desc')
                        ->paginate(10)
                        ->withQueryString();
        
        // Get statistics
        $stats = $this->getJournalStatistics($user->id);
        
        // Get currency pairs for filter dropdown
        $currencyPairs = TradingJournal::where('user_id', $user->id)
                                      ->distinct()
                                      ->pluck('currency_pair')
                                      ->filter()
                                      ->values();
        
        // Get tags for filter dropdown
        $tags = TradingJournal::where('user_id', $user->id)
                             ->whereNotNull('tags')
                             ->get()
                             ->pluck('tags')
                             ->flatten()
                             ->unique()
                             ->values();
        
        return Inertia::render('trading-journal/index', [
            'entries' => $entries,
            'stats' => $stats,
            'filters' => [
                'entry_type' => $entryType,
                'outcome' => $outcome,
                'pair' => $pair,
                'tag' => $tag,
                'favorites' => $favorites,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search' => $search,
            ],
            'currency_pairs' => $currencyPairs,
            'tags' => $tags,
        ]);
    }

    /**
     * Show the form for creating a new journal entry.
     */
    public function create(Request $request)
    {
        $user = Auth::user();
        
        // Get related trade if provided
        $relatedTradeId = $request->input('trade_id');
        $relatedTrade = null;
        
        if ($relatedTradeId) {
            $relatedTrade = TradingPosition::where('id', $relatedTradeId)
                                         ->where('user_id', $user->id)
                                         ->first();
        }
        
        // Get currency pairs for dropdown
        $currencyPairs = TradingPosition::where('user_id', $user->id)
                                      ->distinct()
                                      ->pluck('currency_pair')
                                      ->values();
        
        // Get timeframes for dropdown
        $timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
        
        // Get common indicators for dropdown
        $indicators = [
            'Moving Average',
            'RSI',
            'MACD',
            'Bollinger Bands',
            'Stochastic',
            'Fibonacci',
            'Support/Resistance',
            'Trend Lines',
            'Volume',
            'Ichimoku Cloud',
            'ATR',
            'Pivot Points',
        ];
        
        return Inertia::render('trading-journal/create', [
            'related_trade' => $relatedTrade,
            'currency_pairs' => $currencyPairs,
            'timeframes' => $timeframes,
            'indicators' => $indicators,
        ]);
    }

    /**
     * Store a newly created journal entry.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'entry_type' => 'required|in:idea,strategy,analysis,review',
            'market_condition' => 'nullable|in:bullish,bearish,neutral,volatile,ranging',
            'currency_pair' => 'nullable|string|max:20',
            'timeframe' => 'nullable|string|max:10',
            'entry_price' => 'nullable|numeric',
            'stop_loss' => 'nullable|numeric',
            'take_profit' => 'nullable|numeric',
            'risk_reward_ratio' => 'nullable|numeric',
            'position_size' => 'nullable|numeric',
            'risk_percentage' => 'nullable|numeric|max:100',
            'setup_notes' => 'nullable|string',
            'entry_reason' => 'nullable|string',
            'exit_reason' => 'nullable|string',
            'lessons_learned' => 'nullable|string',
            'indicators_used' => 'nullable|array',
            'screenshots' => 'nullable|array',
            'screenshots.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'related_trade_id' => 'nullable|string|exists:trading_positions,id',
            'trade_outcome' => 'nullable|in:win,loss,breakeven,pending',
            'profit_loss' => 'nullable|numeric',
            'profit_loss_percentage' => 'nullable|numeric',
            'emotional_state' => 'nullable|in:confident,fearful,greedy,patient,impulsive,calm,stressed',
            'trade_rating' => 'nullable|integer|min:1|max:5',
            'followed_plan' => 'nullable|boolean',
            'is_favorite' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'trade_date' => 'nullable|date',
        ]);
        
        // Handle screenshot uploads
        $screenshotPaths = [];
        if ($request->hasFile('screenshots')) {
            foreach ($request->file('screenshots') as $file) {
                $path = $file->store('journal-screenshots', 'public');
                $screenshotPaths[] = $path;
            }
        }
        
        // Calculate risk-reward ratio if not provided
        if (!isset($validated['risk_reward_ratio']) && 
            isset($validated['entry_price']) && 
            isset($validated['stop_loss']) && 
            isset($validated['take_profit'])) {
            
            $risk = abs($validated['entry_price'] - $validated['stop_loss']);
            $reward = abs($validated['take_profit'] - $validated['entry_price']);
            
            if ($risk > 0) {
                $validated['risk_reward_ratio'] = $reward / $risk;
            }
        }
        
        // Create journal entry
        $entry = new TradingJournal($validated);
        $entry->user_id = $user->id;
        $entry->screenshots = $screenshotPaths;
        $entry->trade_date = $validated['trade_date'] ?? now();
        $entry->save();
        
        return redirect()->route('trading-journal.show', $entry->id)
                         ->with('success', 'Journal entry created successfully.');
    }

    /**
     * Display the specified journal entry.
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $entry = TradingJournal::where('id', $id)
                              ->where('user_id', $user->id)
                              ->with(['relatedTrade', 'comments.user'])
                              ->firstOrFail();
        
        return Inertia::render('trading-journal/show', [
            'entry' => $entry,
        ]);
    }

    /**
     * Show the form for editing the specified journal entry.
     */
    public function edit($id)
    {
        $user = Auth::user();
        
        $entry = TradingJournal::where('id', $id)
                              ->where('user_id', $user->id)
                              ->with('relatedTrade')
                              ->firstOrFail();
        
        // Get currency pairs for dropdown
        $currencyPairs = TradingPosition::where('user_id', $user->id)
                                      ->distinct()
                                      ->pluck('currency_pair')
                                      ->values();
        
        // Get timeframes for dropdown
        $timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
        
        // Get common indicators for dropdown
        $indicators = [
            'Moving Average',
            'RSI',
            'MACD',
            'Bollinger Bands',
            'Stochastic',
            'Fibonacci',
            'Support/Resistance',
            'Trend Lines',
            'Volume',
            'Ichimoku Cloud',
            'ATR',
            'Pivot Points',
        ];
        
        return Inertia::render('trading-journal/edit', [
            'entry' => $entry,
            'currency_pairs' => $currencyPairs,
            'timeframes' => $timeframes,
            'indicators' => $indicators,
        ]);
    }

    /**
     * Update the specified journal entry.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        
        $entry = TradingJournal::where('id', $id)
                              ->where('user_id', $user->id)
                              ->firstOrFail();
        
        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'entry_type' => 'required|in:idea,strategy,analysis,review',
            'market_condition' => 'nullable|in:bullish,bearish,neutral,volatile,ranging',
            'currency_pair' => 'nullable|string|max:20',
            'timeframe' => 'nullable|string|max:10',
            'entry_price' => 'nullable|numeric',
            'stop_loss' => 'nullable|numeric',
            'take_profit' => 'nullable|numeric',
            'risk_reward_ratio' => 'nullable|numeric',
            'position_size' => 'nullable|numeric',
            'risk_percentage' => 'nullable|numeric|max:100',
            'setup_notes' => 'nullable|string',
            'entry_reason' => 'nullable|string',
            'exit_reason' => 'nullable|string',
            'lessons_learned' => 'nullable|string',
            'indicators_used' => 'nullable|array',
            'new_screenshots' => 'nullable|array',
            'new_screenshots.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'keep_screenshots' => 'nullable|array',
            'related_trade_id' => 'nullable|string|exists:trading_positions,id',
            'trade_outcome' => 'nullable|in:win,loss,breakeven,pending',
            'profit_loss' => 'nullable|numeric',
            'profit_loss_percentage' => 'nullable|numeric',
            'emotional_state' => 'nullable|in:confident,fearful,greedy,patient,impulsive,calm,stressed',
            'trade_rating' => 'nullable|integer|min:1|max:5',
            'followed_plan' => 'nullable|boolean',
            'is_favorite' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'trade_date' => 'nullable|date',
        ]);
        
        // Handle screenshot uploads and deletions
        $screenshotPaths = $request->input('keep_screenshots', []);
        
        // Delete removed screenshots
        $currentScreenshots = $entry->screenshots ?? [];
        foreach ($currentScreenshots as $path) {
            if (!in_array($path, $screenshotPaths)) {
                Storage::disk('public')->delete($path);
            }
        }
        
        // Add new screenshots
        if ($request->hasFile('new_screenshots')) {
            foreach ($request->file('new_screenshots') as $file) {
                $path = $file->store('journal-screenshots', 'public');
                $screenshotPaths[] = $path;
            }
        }
        
        // Calculate risk-reward ratio if not provided
        if (!isset($validated['risk_reward_ratio']) && 
            isset($validated['entry_price']) && 
            isset($validated['stop_loss']) && 
            isset($validated['take_profit'])) {
            
            $risk = abs($validated['entry_price'] - $validated['stop_loss']);
            $reward = abs($validated['take_profit'] - $validated['entry_price']);
            
            if ($risk > 0) {
                $validated['risk_reward_ratio'] = $reward / $risk;
            }
        }
        
        // Update journal entry
        $entry->fill($validated);
        $entry->screenshots = $screenshotPaths;
        $entry->save();
        
        return redirect()->route('trading-journal.show', $entry->id)
                         ->with('success', 'Journal entry updated successfully.');
    }

    /**
     * Remove the specified journal entry.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        
        $entry = TradingJournal::where('id', $id)
                              ->where('user_id', $user->id)
                              ->firstOrFail();
        
        // Delete screenshots
        if (!empty($entry->screenshots)) {
            foreach ($entry->screenshots as $path) {
                Storage::disk('public')->delete($path);
            }
        }
        
        // Delete entry
        $entry->delete();
        
        return redirect()->route('trading-journal.index')
                         ->with('success', 'Journal entry deleted successfully.');
    }

    /**
     * Toggle favorite status for a journal entry.
     */
    public function toggleFavorite($id)
    {
        $user = Auth::user();
        
        $entry = TradingJournal::where('id', $id)
                              ->where('user_id', $user->id)
                              ->firstOrFail();
        
        $entry->is_favorite = !$entry->is_favorite;
        $entry->save();
        
        return back()->with('success', 'Favorite status updated.');
    }

    /**
     * Get statistics for journal entries.
     */
    private function getJournalStatistics($userId)
    {
        // Total entries
        $totalEntries = TradingJournal::where('user_id', $userId)->count();
        
        // Entries by type
        $entriesByType = TradingJournal::where('user_id', $userId)
                                     ->selectRaw('entry_type, count(*) as count')
                                     ->groupBy('entry_type')
                                     ->pluck('count', 'entry_type')
                                     ->toArray();
        
        // Win/loss statistics
        $winLossStats = TradingJournal::where('user_id', $userId)
                                    ->whereNotNull('trade_outcome')
                                    ->selectRaw('trade_outcome, count(*) as count')
                                    ->groupBy('trade_outcome')
                                    ->pluck('count', 'trade_outcome')
                                    ->toArray();
        
        $wins = $winLossStats['win'] ?? 0;
        $losses = $winLossStats['loss'] ?? 0;
        $breakeven = $winLossStats['breakeven'] ?? 0;
        $pending = $winLossStats['pending'] ?? 0;
        
        $totalTrades = $wins + $losses + $breakeven + $pending;
        $winRate = $totalTrades > 0 ? round(($wins / $totalTrades) * 100, 2) : 0;
        
        // Average risk-reward ratio
        $avgRiskReward = TradingJournal::where('user_id', $userId)
                                      ->whereNotNull('risk_reward_ratio')
                                      ->avg('risk_reward_ratio') ?? 0;
        
        // Average profit/loss
        $avgProfitLoss = TradingJournal::where('user_id', $userId)
                                      ->whereNotNull('profit_loss')
                                      ->avg('profit_loss') ?? 0;
        
        // Total profit/loss
        $totalProfitLoss = TradingJournal::where('user_id', $userId)
                                        ->whereNotNull('profit_loss')
                                        ->sum('profit_loss') ?? 0;
        
        // Most traded pairs
        $mostTradedPairs = TradingJournal::where('user_id', $userId)
                                        ->whereNotNull('currency_pair')
                                        ->selectRaw('currency_pair, count(*) as count')
                                        ->groupBy('currency_pair')
                                        ->orderBy('count', 'desc')
                                        ->limit(5)
                                        ->pluck('count', 'currency_pair')
                                        ->toArray();
        
        // Emotional state correlation with outcomes
        $emotionalOutcomes = TradingJournal::where('user_id', $userId)
                                         ->whereNotNull('emotional_state')
                                         ->whereNotNull('trade_outcome')
                                         ->selectRaw('emotional_state, trade_outcome, count(*) as count')
                                         ->groupBy(['emotional_state', 'trade_outcome'])
                                         ->get()
                                         ->groupBy('emotional_state')
                                         ->map(function ($group) {
                                             return $group->pluck('count', 'trade_outcome')->toArray();
                                         })
                                         ->toArray();
        
        return [
            'total_entries' => $totalEntries,
            'entries_by_type' => $entriesByType,
            'win_loss_stats' => [
                'wins' => $wins,
                'losses' => $losses,
                'breakeven' => $breakeven,
                'pending' => $pending,
                'win_rate' => $winRate,
            ],
            'avg_risk_reward' => round($avgRiskReward, 2),
            'avg_profit_loss' => round($avgProfitLoss, 2),
            'total_profit_loss' => round($totalProfitLoss, 2),
            'most_traded_pairs' => $mostTradedPairs,
            'emotional_outcomes' => $emotionalOutcomes,
        ];
    }
}
