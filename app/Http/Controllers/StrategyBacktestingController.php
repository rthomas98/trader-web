<?php

namespace App\Http\Controllers;

use App\Services\HistoricalDataService;
use App\Services\PerformanceCalculationService;
use App\Services\StrategyExecutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class StrategyBacktestingController extends Controller
{
    /**
     * The historical data service instance.
     */
    protected HistoricalDataService $historicalDataService;

    /**
     * The strategy execution service instance.
     */
    protected StrategyExecutionService $strategyExecutionService;

    /**
     * The performance calculation service instance.
     */
    protected PerformanceCalculationService $performanceCalculationService;

    /**
     * Create a new controller instance.
     *
     * @param HistoricalDataService $historicalDataService
     * @param StrategyExecutionService $strategyExecutionService
     * @param PerformanceCalculationService $performanceCalculationService
     * @return void
     */
    public function __construct(
        HistoricalDataService $historicalDataService,
        StrategyExecutionService $strategyExecutionService,
        PerformanceCalculationService $performanceCalculationService
    )
    {
        $this->historicalDataService = $historicalDataService;
        $this->strategyExecutionService = $strategyExecutionService;
        $this->performanceCalculationService = $performanceCalculationService;
    }

    /**
     * Display the strategy backtesting configuration page.
     */
    public function index(): Response
    {
        $breadcrumbs = [
            ['label' => 'Dashboard', 'url' => route('dashboard')],
            ['label' => 'Strategy Backtesting', 'url' => route('strategy-backtesting.index')],
        ];

        return Inertia::render('StrategyBacktesting/Index', [
            'breadcrumbs' => $breadcrumbs,
            // We will pass more data later (strategies, instruments, etc.)
        ]);
    }

    /**
     * Run the strategy backtest based on user parameters.
     */
    public function runBacktest(Request $request): JsonResponse
    {
        // Validate the incoming request data (basic example)
        $validatedData = $request->validate([
            'strategy' => ['required', 'string'],
            'instrument' => ['required', 'string'],
            'timeframe' => ['required', 'string'],
            'initialCapital' => ['required', 'numeric', 'min:1'],
        ]);

        // Fetch historical data using the service
        try {
            $historicalData = $this->historicalDataService->getHistoricalData(
                $validatedData['instrument'],
                $validatedData['timeframe']
                // TODO: Add start/end date parameters later if needed
            );
            Log::info('Historical data fetched for backtest.', ['count' => count($historicalData)]);
        } catch (\Exception $e) {
            Log::error('Error fetching historical data for backtest.', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Failed to fetch historical data.'], 500);
        }

        // Execute the strategy using the service
        try {
            $trades = $this->strategyExecutionService->executeStrategy(
                $historicalData,
                $validatedData['strategy']
                // TODO: Add strategy-specific parameters later
            );
            Log::info('Strategy executed for backtest.', ['trade_count' => count($trades)]);
        } catch (\Exception $e) {
            Log::error('Error executing strategy for backtest.', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Failed to execute strategy.'], 500);
        }

        // Calculate performance metrics using the service
        try {
            $performanceMetrics = $this->performanceCalculationService->calculatePerformance(
                $trades,
                (float)$validatedData['initialCapital']
            );
        } catch (\Exception $e) {
             Log::error('Error calculating performance metrics for backtest.', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Failed to calculate performance metrics.'], 500);
        }

        // Placeholder response
        $results = [
            'status' => 'success',
            'message' => 'Backtest simulation completed (placeholder).',
            'parameters' => $validatedData,
            'data_points_fetched' => count($historicalData), // Include count in response
            'trades' => $trades, // Include trades from execution service
            'performance' => $performanceMetrics, // Include calculated metrics
        ];

        return response()->json($results);
    }
}
