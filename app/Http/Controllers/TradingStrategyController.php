<?php

namespace App\Http\Controllers;

use App\Models\TradingStrategy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TradingStrategyController extends Controller
{
    /**
     * Display a listing of the user's trading strategies.
     */
    public function index(Request $request): InertiaResponse
    {
        $user = Auth::user();
        $query = $user->strategies(); // Start query builder

        // Search
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        // Filters
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->filled('risk_level')) {
            $query->where('risk_level', $request->input('risk_level'));
        }
        if ($request->filled('timeframe')) {
            $query->where('timeframe', $request->input('timeframe'));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at'); // Default sort column
        $sortDirection = $request->input('sort_direction', 'desc'); // Default sort direction

        // Basic validation for sort column to prevent arbitrary column sorting
        $allowedSortColumns = ['name', 'type', 'risk_level', 'timeframe', 'created_at', 'updated_at'];
        if (in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc'); // Fallback sort
        }

        // Pagination (e.g., 12 items per page)
        $strategies = $query->paginate(12)->withQueryString(); // Paginate results & append query string

        // Set up breadcrumbs
        $breadcrumbs = [
            ['name' => 'Dashboard', 'href' => route('dashboard')],
            ['name' => 'My Trading Strategies', 'href' => route('my-strategies.index')],
        ];

        return Inertia::render('TradingStrategies/Index', [
            'breadcrumbs' => $breadcrumbs,
            'strategies' => $strategies,
            'filters' => $request->only(['search', 'type', 'risk_level', 'timeframe']), // Pass filters back
            'sort' => ['by' => $sortBy, 'direction' => $sortDirection] // Pass sort info back
        ]);
    }

    /**
     * Store a newly created strategy in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'nullable|string|max:50',
            'risk_level' => 'nullable|string|max:50',
            'target_assets' => 'nullable|string|max:500',
            'timeframe' => 'nullable|string|max:10',
        ]);

        $user = Auth::user();
        $strategy = $user->strategies()->create($validated);

        return redirect()->route('my-strategies.index')
            ->with('success', 'Strategy created successfully.');
    }

    /**
     * Update the specified strategy in storage.
     */
    public function update(Request $request, TradingStrategy $strategy)
    {
        // Check if the authenticated user owns this strategy
        if ($strategy->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'nullable|string|max:50',
            'risk_level' => 'nullable|string|max:50',
            'target_assets' => 'nullable|string|max:500',
            'timeframe' => 'nullable|string|max:10',
        ]);

        $strategy->update($validated);

        return redirect()->route('my-strategies.index')
            ->with('success', 'Strategy updated successfully.');
    }

    /**
     * Remove the specified strategy from storage.
     */
    public function destroy(TradingStrategy $strategy)
    {
        // Check if the authenticated user owns this strategy
        if ($strategy->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $strategy->delete();

        return redirect()->route('my-strategies.index')
            ->with('success', 'Strategy deleted successfully.');
    }
}
