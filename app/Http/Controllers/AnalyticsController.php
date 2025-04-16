<?php

namespace App\Http\Controllers;

use App\Models\TradingPosition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Display the performance analytics page.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get performance data
        $performanceData = $this->getPerformanceData($user->id);
        
        return Inertia::render('analytics/index', [
            'performanceData' => $performanceData,
        ]);
    }
    
    /**
     * Get performance analytics data.
     */
    private function getPerformanceData($userId)
    {
        // Get closed trades for this user
        $closedTrades = TradingPosition::where('user_id', $userId)
            ->where('status', 'CLOSED')
            ->whereNotNull('exit_time')
            ->orderBy('exit_time')
            ->get();
            
        // If no trades, return empty data structure
        if ($closedTrades->isEmpty()) {
            return $this->getEmptyPerformanceData();
        }
        
        // Calculate daily P&L
        $dailyPnL = $this->calculateDailyPnL($closedTrades);
        
        // Calculate cumulative P&L
        $cumulativePnL = $this->calculateCumulativePnL($dailyPnL);
        
        // Calculate win/loss ratio
        $winLossRatio = $this->calculateWinLossRatio($closedTrades);
        
        // Calculate trade volume
        $tradeVolume = $this->calculateTradeVolume($closedTrades);
        
        // Calculate asset performance
        $assetPerformance = $this->calculateAssetPerformance($closedTrades);
        
        // Get benchmark data for comparison
        $benchmarks = $this->getBenchmarkData($dailyPnL['dates']);
        
        // Calculate additional metrics
        $additionalMetrics = $this->calculateAdditionalMetrics($closedTrades, $dailyPnL, $cumulativePnL);
        
        return [
            'dailyPnL' => $dailyPnL,
            'cumulativePnL' => $cumulativePnL,
            'winLossRatio' => $winLossRatio,
            'tradeVolume' => $tradeVolume,
            'assetPerformance' => $assetPerformance,
            'benchmarks' => $benchmarks,
            'metrics' => $additionalMetrics,
        ];
    }
    
    /**
     * Calculate daily P&L from closed trades.
     */
    private function calculateDailyPnL($trades)
    {
        $dailyPnL = [];
        
        // Group trades by day and sum P&L
        foreach ($trades as $trade) {
            $date = Carbon::parse($trade->exit_time)->format('Y-m-d');
            
            if (!isset($dailyPnL[$date])) {
                $dailyPnL[$date] = 0;
            }
            
            $dailyPnL[$date] += $trade->profit_loss;
        }
        
        // Sort by date
        ksort($dailyPnL);
        
        // Format for ApexCharts
        $dates = array_keys($dailyPnL);
        $values = array_values($dailyPnL);
        
        return [
            'dates' => $dates,
            'values' => $values,
        ];
    }
    
    /**
     * Calculate cumulative P&L from daily P&L.
     */
    private function calculateCumulativePnL($dailyPnL)
    {
        $dates = $dailyPnL['dates'];
        $values = $dailyPnL['values'];
        
        $cumulativeValues = [];
        $runningTotal = 0;
        
        foreach ($values as $value) {
            $runningTotal += $value;
            $cumulativeValues[] = $runningTotal;
        }
        
        return [
            'dates' => $dates,
            'values' => $cumulativeValues,
        ];
    }
    
    /**
     * Calculate win/loss ratio from closed trades.
     */
    private function calculateWinLossRatio($trades)
    {
        $wins = 0;
        $losses = 0;
        
        foreach ($trades as $trade) {
            if ($trade->profit_loss > 0) {
                $wins++;
            } elseif ($trade->profit_loss < 0) {
                $losses++;
            }
            // Ignore trades with exactly 0 profit/loss
        }
        
        return [
            'labels' => ['Winning Trades', 'Losing Trades'],
            'values' => [$wins, $losses],
        ];
    }
    
    /**
     * Calculate trade volume over time.
     */
    private function calculateTradeVolume($trades)
    {
        $tradeVolume = [];
        
        // Group trades by day and count
        foreach ($trades as $trade) {
            $date = Carbon::parse($trade->exit_time)->format('Y-m-d');
            
            if (!isset($tradeVolume[$date])) {
                $tradeVolume[$date] = 0;
            }
            
            $tradeVolume[$date]++;
        }
        
        // Sort by date
        ksort($tradeVolume);
        
        // Format for ApexCharts
        $dates = array_keys($tradeVolume);
        $values = array_values($tradeVolume);
        
        return [
            'dates' => $dates,
            'values' => $values,
        ];
    }
    
    /**
     * Calculate performance by asset/currency pair.
     */
    private function calculateAssetPerformance($trades)
    {
        $assetPerformance = [];
        
        // Group trades by currency pair and sum P&L
        foreach ($trades as $trade) {
            $asset = $trade->currency_pair;
            
            if (!isset($assetPerformance[$asset])) {
                $assetPerformance[$asset] = 0;
            }
            
            $assetPerformance[$asset] += $trade->profit_loss;
        }
        
        // Sort by P&L (descending)
        arsort($assetPerformance);
        
        // Take top 10 assets
        $assetPerformance = array_slice($assetPerformance, 0, 10, true);
        
        // Format for ApexCharts
        $assets = array_keys($assetPerformance);
        $performance = array_values($assetPerformance);
        
        return [
            'assets' => $assets,
            'performance' => $performance,
        ];
    }
    
    /**
     * Return empty performance data structure.
     */
    private function getEmptyPerformanceData()
    {
        return [
            'dailyPnL' => [
                'dates' => [],
                'values' => [],
            ],
            'cumulativePnL' => [
                'dates' => [],
                'values' => [],
            ],
            'winLossRatio' => [
                'labels' => ['Winning Trades', 'Losing Trades'],
                'values' => [0, 0],
            ],
            'tradeVolume' => [
                'dates' => [],
                'values' => [],
            ],
            'assetPerformance' => [
                'assets' => [],
                'performance' => [],
            ],
            'benchmarks' => [
                'spx' => [
                    'dates' => [],
                    'values' => [],
                ],
                'dxy' => [
                    'dates' => [],
                    'values' => [],
                ],
            ],
            'metrics' => [
                'sharpeRatio' => 0,
                'maxDrawdown' => 0,
                'maxDrawdownPercent' => 0,
                'avgTradeDuration' => 0,
                'profitFactor' => 0,
                'expectancy' => 0,
                'avgWinningTrade' => 0,
                'avgLosingTrade' => 0,
            ],
        ];
    }
    
    /**
     * Get benchmark data for comparison with user performance.
     * 
     * @param array $tradeDates Array of dates to match benchmark data to
     * @return array Benchmark data for comparison
     */
    private function getBenchmarkData($tradeDates)
    {
        if (empty($tradeDates)) {
            return [
                'spx' => [
                    'dates' => [],
                    'values' => [],
                ],
                'dxy' => [
                    'dates' => [],
                    'values' => [],
                ],
            ];
        }
        
        // Get date range
        $startDate = $tradeDates[0];
        $endDate = end($tradeDates);
        
        // Fetch S&P 500 data (simulated for demo)
        $spxData = $this->fetchSimulatedBenchmarkData('SPX', $startDate, $endDate);
        
        // Fetch Dollar Index data (simulated for demo)
        $dxyData = $this->fetchSimulatedBenchmarkData('DXY', $startDate, $endDate);
        
        return [
            'spx' => $spxData,
            'dxy' => $dxyData,
        ];
    }
    
    /**
     * Fetch simulated benchmark data.
     * In a production environment, this would connect to a market data API.
     * 
     * @param string $symbol The benchmark symbol (e.g., 'SPX', 'DXY')
     * @param string $startDate Start date in Y-m-d format
     * @param string $endDate End date in Y-m-d format
     * @return array Benchmark data with dates and values
     */
    private function fetchSimulatedBenchmarkData($symbol, $startDate, $endDate)
    {
        $dates = [];
        $values = [];
        
        $currentDate = Carbon::parse($startDate);
        $lastDate = Carbon::parse($endDate);
        
        // Base value and volatility differ by symbol
        $baseValue = ($symbol === 'SPX') ? 4000 : 100;
        $volatility = ($symbol === 'SPX') ? 20 : 0.5;
        $trend = ($symbol === 'SPX') ? 0.1 : -0.02; // Slight uptrend for SPX, slight downtrend for DXY
        
        $value = $baseValue;
        
        while ($currentDate->lte($lastDate)) {
            // Skip weekends for realistic market data
            if ($currentDate->isWeekday()) {
                $dates[] = $currentDate->format('Y-m-d');
                
                // Random walk with slight trend
                $change = (mt_rand(-100, 100) / 100) * $volatility + $trend;
                $value += $change;
                $values[] = $value;
            }
            
            $currentDate->addDay();
        }
        
        return [
            'dates' => $dates,
            'values' => $values,
        ];
    }
    
    /**
     * Calculate additional performance metrics.
     * 
     * @param \Illuminate\Database\Eloquent\Collection $trades Collection of trading positions
     * @param array $dailyPnL Daily P&L data
     * @param array $cumulativePnL Cumulative P&L data
     * @return array Additional metrics
     */
    private function calculateAdditionalMetrics($trades, $dailyPnL, $cumulativePnL)
    {
        // Initialize metrics
        $metrics = [
            'sharpeRatio' => 0,
            'maxDrawdown' => 0,
            'maxDrawdownPercent' => 0,
            'avgTradeDuration' => 0,
            'profitFactor' => 0,
            'expectancy' => 0,
            'avgWinningTrade' => 0,
            'avgLosingTrade' => 0,
        ];
        
        // Calculate Sharpe Ratio (using daily returns)
        if (count($dailyPnL['values']) > 1) {
            $returns = $dailyPnL['values'];
            $meanReturn = array_sum($returns) / count($returns);
            
            // Calculate standard deviation
            $variance = 0;
            foreach ($returns as $return) {
                $variance += pow($return - $meanReturn, 2);
            }
            $stdDev = sqrt($variance / count($returns));
            
            // Annualized Sharpe Ratio (assuming 252 trading days per year)
            // Risk-free rate is assumed to be 0 for simplicity
            $metrics['sharpeRatio'] = $stdDev > 0 ? 
                ($meanReturn / $stdDev) * sqrt(252) : 0;
        }
        
        // Calculate Maximum Drawdown
        if (count($cumulativePnL['values']) > 0) {
            $peak = $cumulativePnL['values'][0];
            $maxDrawdown = 0;
            $maxDrawdownPercent = 0;
            
            foreach ($cumulativePnL['values'] as $value) {
                if ($value > $peak) {
                    $peak = $value;
                }
                
                $drawdown = $peak - $value;
                $drawdownPercent = $peak > 0 ? ($drawdown / $peak) * 100 : 0;
                
                if ($drawdown > $maxDrawdown) {
                    $maxDrawdown = $drawdown;
                    $maxDrawdownPercent = $drawdownPercent;
                }
            }
            
            $metrics['maxDrawdown'] = $maxDrawdown;
            $metrics['maxDrawdownPercent'] = $maxDrawdownPercent;
        }
        
        // Calculate Average Trade Duration
        $totalDuration = 0;
        $tradeCount = count($trades);
        
        // Calculate profit factor and expectancy
        $totalProfit = 0;
        $totalLoss = 0;
        $winCount = 0;
        $lossCount = 0;
        $totalWinAmount = 0;
        $totalLossAmount = 0;
        
        foreach ($trades as $trade) {
            // Trade duration
            $entryTime = Carbon::parse($trade->entry_time);
            $exitTime = Carbon::parse($trade->exit_time);
            $duration = $entryTime->diffInMinutes($exitTime);
            $totalDuration += $duration;
            
            // Profit/Loss metrics
            if ($trade->profit_loss > 0) {
                $totalProfit += $trade->profit_loss;
                $winCount++;
                $totalWinAmount += $trade->profit_loss;
            } else if ($trade->profit_loss < 0) {
                $totalLoss += abs($trade->profit_loss);
                $lossCount++;
                $totalLossAmount += abs($trade->profit_loss);
            }
        }
        
        $metrics['avgTradeDuration'] = $tradeCount > 0 ? 
            $totalDuration / $tradeCount : 0;
            
        // Profit Factor = Gross Profit / Gross Loss
        $metrics['profitFactor'] = $totalLoss > 0 ? 
            $totalProfit / $totalLoss : ($totalProfit > 0 ? 999 : 0);
            
        // Expectancy = (Win% * Avg Win) - (Loss% * Avg Loss)
        $avgWin = $winCount > 0 ? $totalWinAmount / $winCount : 0;
        $avgLoss = $lossCount > 0 ? $totalLossAmount / $lossCount : 0;
        $winRate = $tradeCount > 0 ? $winCount / $tradeCount : 0;
        $lossRate = $tradeCount > 0 ? $lossCount / $tradeCount : 0;
        
        $metrics['expectancy'] = ($winRate * $avgWin) - ($lossRate * $avgLoss);
        $metrics['avgWinningTrade'] = $avgWin;
        $metrics['avgLosingTrade'] = $avgLoss;
        
        return $metrics;
    }
}
