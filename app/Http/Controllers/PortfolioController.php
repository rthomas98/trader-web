<?php

namespace App\Http\Controllers;

use App\Models\PortfolioPosition;
use App\Services\MarketDataService;
use App\Services\PortfolioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PortfolioController extends Controller
{
    protected $portfolioService;
    protected $marketDataService;
    
    /**
     * Create a new controller instance.
     */
    public function __construct(PortfolioService $portfolioService, MarketDataService $marketDataService)
    {
        $this->portfolioService = $portfolioService;
        $this->marketDataService = $marketDataService;
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get portfolio summary and positions with current prices
        $portfolioData = $this->portfolioService->getPortfolioSummary($user);
        $positions = $portfolioData['positions'];
        $summary = $portfolioData['summary'];
        $allocations = $portfolioData['allocations'];
        
        return Inertia::render('portfolio/index', [
            'positions' => $positions,
            'allocations' => $allocations,
            'totalValue' => $summary['total_value'],
            'summary' => $summary,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('portfolio/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'symbol' => 'required|string|max:20',
            'name' => 'required|string|max:100',
            'quantity' => 'required|numeric|min:0.00000001',
            'average_price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $position = $this->portfolioService->addOrUpdatePosition(
                $user,
                $validated['symbol'],
                $validated['name'],
                $validated['quantity'],
                $validated['average_price'],
                $validated['category'] ?? null,
                $validated['notes'] ?? null
            );
            
            return redirect()->route('portfolio.index')
                ->with('success', 'Position added successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to add position: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $position = $user->portfolioPositions()->findOrFail($id);
        
        // Get current price and symbol details
        $currentPrice = $this->marketDataService->getCurrentPrice($position->symbol);
        $symbolDetails = $this->marketDataService->getSymbolDetails($position->symbol);
        
        // Calculate position metrics
        $positionData = $this->portfolioService->getPositionDetails($position, $currentPrice);
        
        // Get historical performance data
        $historicalData = $this->portfolioService->getPositionPerformanceData($position);
        
        return Inertia::render('portfolio/show', [
            'position' => $positionData,
            'symbolDetails' => $symbolDetails,
            'historicalData' => $historicalData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $position = Auth::user()->portfolioPositions()->findOrFail($id);
        $currentPrice = $this->marketDataService->getCurrentPrice($position->symbol);
        
        return Inertia::render('portfolio/edit', [
            'position' => $position,
            'currentPrice' => $currentPrice,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $position = $user->portfolioPositions()->findOrFail($id);
        
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0',
            'average_price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            if ($validated['quantity'] > 0) {
                $this->portfolioService->updatePosition(
                    $position,
                    $validated['quantity'],
                    $validated['average_price'],
                    $validated['category'] ?? null,
                    $validated['notes'] ?? null
                );
                
                return redirect()->route('portfolio.index')
                    ->with('success', 'Position updated successfully.');
            } else {
                $this->portfolioService->removePosition($position);
                
                return redirect()->route('portfolio.index')
                    ->with('success', 'Position removed successfully.');
            }
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update position: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $position = Auth::user()->portfolioPositions()->findOrFail($id);
        
        try {
            $this->portfolioService->removePosition($position);
            
            return redirect()->route('portfolio.index')
                ->with('success', 'Position removed successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to remove position: ' . $e->getMessage());
        }
    }

    /**
     * Get current price for a symbol.
     */
    public function getCurrentPrice(Request $request)
    {
        $validated = $request->validate([
            'symbol' => 'required|string|max:20',
        ]);
        
        $price = $this->marketDataService->getCurrentPrice($validated['symbol']);
        
        return response()->json([
            'symbol' => $validated['symbol'],
            'price' => $price,
            'timestamp' => now()->timestamp,
        ]);
    }

    /**
     * Get historical price data for a symbol.
     */
    public function getHistoricalPriceData(Request $request)
    {
        $validated = $request->validate([
            'symbol' => 'required|string|max:20',
            'timeframe' => 'required|in:1d,1w,1m,3m,6m,1y,5y',
        ]);
        
        $data = $this->marketDataService->getHistoricalPriceData(
            $validated['symbol'],
            $validated['timeframe']
        );
        
        return response()->json($data);
    }
    
    /**
     * Import portfolio positions from CSV.
     */
    public function import(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);
        
        $file = $request->file('file');
        $path = $file->getRealPath();
        $records = array_map('str_getcsv', file($path));
        
        // Remove header row
        array_shift($records);
        
        try {
            $result = $this->portfolioService->importPositions($user, $records);
            
            return redirect()->route('portfolio.index')
                ->with('success', "Imported {$result['imported']} positions successfully. {$result['errors']} errors encountered.");
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to import positions: ' . $e->getMessage());
        }
    }
    
    /**
     * Export portfolio positions to CSV.
     */
    public function export()
    {
        $user = Auth::user();
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="portfolio_export_' . now()->format('Y-m-d') . '.csv"',
        ];
        
        $callback = function() use ($user) {
            $file = fopen('php://output', 'w');
            
            // Add header row
            fputcsv($file, ['Symbol', 'Name', 'Quantity', 'Average Price', 'Category', 'Notes']);
            
            // Get all positions
            $positions = $user->portfolioPositions()->get();
            
            // Add data rows
            foreach ($positions as $position) {
                fputcsv($file, [
                    $position->symbol,
                    $position->name,
                    $position->quantity,
                    $position->average_price,
                    $position->category,
                    $position->notes,
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}
