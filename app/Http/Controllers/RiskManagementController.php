<?php

namespace App\Http\Controllers;

use App\Models\TradingPosition;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class RiskManagementController extends Controller
{
    /**
     * Display the risk management dashboard.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get user's active trading wallet
        $activeWallet = $user->activeTradeWallet();
        
        // Get risk profile data
        $riskProfile = $this->getRiskProfile($user->id);
        
        // Get position sizing recommendations
        $positionSizing = $this->getPositionSizing($activeWallet);
        
        // Get risk metrics
        $riskMetrics = $this->getRiskMetrics($user->id);
        
        // Get drawdown alerts
        $drawdownAlerts = $this->getDrawdownAlerts($user->id);
        
        return Inertia::render('risk-management/index', [
            'riskProfile' => $riskProfile,
            'positionSizing' => $positionSizing,
            'riskMetrics' => $riskMetrics,
            'drawdownAlerts' => $drawdownAlerts,
            'activeWallet' => $activeWallet,
        ]);
    }
    
    /**
     * Get the user's risk profile.
     */
    private function getRiskProfile($userId)
    {
        $user = User::find($userId);
        
        // Get historical risk data
        $historicalRisk = DB::table('trading_positions')
            ->where('user_id', $userId)
            ->where('status', 'CLOSED')
            ->select(
                DB::raw('DATE(exit_time) as date'),
                DB::raw('SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as total_loss'),
                DB::raw('SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as total_profit'),
                DB::raw('COUNT(*) as trade_count')
            )
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();
        
        // Calculate average risk per trade
        $avgRiskPerTrade = DB::table('trading_positions')
            ->where('user_id', $userId)
            ->where('status', 'CLOSED')
            ->whereNotNull('stop_loss')
            ->whereNotNull('entry_price')
            ->select(
                DB::raw('AVG(ABS(entry_price - stop_loss) / entry_price * 100) as avg_risk_percentage')
            )
            ->first();
        
        return [
            'riskPercentage' => $user->risk_percentage ?? 2.0,
            'historicalRisk' => $historicalRisk,
            'avgRiskPerTrade' => $avgRiskPerTrade ? $avgRiskPerTrade->avg_risk_percentage : 0,
            'riskToleranceLevel' => $this->calculateRiskToleranceLevel($user),
        ];
    }
    
    /**
     * Calculate the user's risk tolerance level based on trading history and settings.
     */
    private function calculateRiskToleranceLevel($user)
    {
        // Default to moderate if no history
        $level = 'moderate';
        
        // Get closed positions
        $closedPositions = $user->tradingPositions()
            ->where('status', 'CLOSED')
            ->get();
        
        if ($closedPositions->count() > 0) {
            // Calculate win rate
            $winCount = $closedPositions->where('profit_loss', '>', 0)->count();
            $winRate = $closedPositions->count() > 0 ? ($winCount / $closedPositions->count()) * 100 : 0;
            
            // Calculate average position size relative to account
            $avgPositionSize = $closedPositions->avg('quantity');
            $accountSize = $user->account_balance;
            $relativeSize = $accountSize > 0 ? ($avgPositionSize / $accountSize) * 100 : 0;
            
            // Determine level based on win rate, user settings, and position sizing
            if ($winRate > 60 && $user->risk_percentage <= 1 && $relativeSize < 5) {
                $level = 'conservative';
            } elseif ($winRate < 40 || $user->risk_percentage > 5 || $relativeSize > 15) {
                $level = 'aggressive';
            }
        }
        
        return $level;
    }
    
    /**
     * Get position sizing recommendations based on account balance and risk settings.
     */
    private function getPositionSizing($wallet)
    {
        if (!$wallet) {
            return [
                'fixedRisk' => [],
                'percentageRisk' => [],
                'riskRewardRatios' => [],
            ];
        }
        
        $accountBalance = $wallet->balance;
        $riskPercentage = $wallet->user->risk_percentage ?? 2.0;
        $maxRiskAmount = $accountBalance * ($riskPercentage / 100);
        
        // Common currency pairs with typical pip values
        $commonPairs = [
            'EUR/USD' => ['pipValue' => 0.0001, 'avgSpread' => 1.0],
            'GBP/USD' => ['pipValue' => 0.0001, 'avgSpread' => 1.5],
            'USD/JPY' => ['pipValue' => 0.01, 'avgSpread' => 1.5],
            'USD/CHF' => ['pipValue' => 0.0001, 'avgSpread' => 1.8],
            'AUD/USD' => ['pipValue' => 0.0001, 'avgSpread' => 1.4],
            'EUR/GBP' => ['pipValue' => 0.0001, 'avgSpread' => 1.9],
        ];
        
        $fixedRisk = [];
        $percentageRisk = [];
        
        foreach ($commonPairs as $pair => $details) {
            // Calculate for different stop loss levels (20, 50, 100 pips)
            foreach ([20, 50, 100] as $stopLossPips) {
                $riskPerPip = $maxRiskAmount / $stopLossPips;
                $lotSize = round($riskPerPip / 10, 2); // Standard lot = $10 per pip
                
                $fixedRisk[] = [
                    'pair' => $pair,
                    'stopLossPips' => $stopLossPips,
                    'maxRiskAmount' => $maxRiskAmount,
                    'recommendedLotSize' => $lotSize,
                    'positionSize' => $lotSize * 100000, // Standard lot = 100,000 units
                ];
            }
            
            // Calculate percentage-based risk for different risk-reward ratios
            foreach ([1, 2, 3] as $riskRewardRatio) {
                $percentageRisk[] = [
                    'pair' => $pair,
                    'riskPercentage' => $riskPercentage,
                    'riskRewardRatio' => $riskRewardRatio,
                    'potentialProfit' => $maxRiskAmount * $riskRewardRatio,
                    'potentialLoss' => $maxRiskAmount,
                ];
            }
        }
        
        // Calculate optimal risk-reward ratios based on historical win rate
        $riskRewardRatios = $this->calculateOptimalRiskRewardRatios($wallet->user_id);
        
        return [
            'fixedRisk' => $fixedRisk,
            'percentageRisk' => $percentageRisk,
            'riskRewardRatios' => $riskRewardRatios,
        ];
    }
    
    /**
     * Calculate optimal risk-reward ratios based on historical win rate.
     */
    private function calculateOptimalRiskRewardRatios($userId)
    {
        $closedPositions = TradingPosition::where('user_id', $userId)
            ->where('status', 'CLOSED')
            ->get();
        
        $winCount = $closedPositions->where('profit_loss', '>', 0)->count();
        $winRate = $closedPositions->count() > 0 ? ($winCount / $closedPositions->count()) : 0.5;
        
        // Calculate Kelly criterion
        $kellyPercentage = max(0, min(100, ($winRate - ((1 - $winRate) / 1)) * 100));
        
        // Calculate optimal risk-reward ratio based on win rate
        $optimalRatio = $winRate > 0 ? (1 - $winRate) / $winRate : 1;
        
        // Calculate expected value for different R:R ratios
        $expectedValues = [];
        foreach ([0.5, 1, 1.5, 2, 2.5, 3] as $ratio) {
            $expectedValue = ($winRate * $ratio) - (1 - $winRate);
            $expectedValues[] = [
                'ratio' => $ratio,
                'expectedValue' => $expectedValue,
                'isOptimal' => abs($ratio - $optimalRatio) < 0.3, // Within 0.3 of optimal
            ];
        }
        
        return [
            'winRate' => $winRate * 100,
            'kellyPercentage' => $kellyPercentage,
            'optimalRatio' => $optimalRatio,
            'expectedValues' => $expectedValues,
        ];
    }
    
    /**
     * Get risk metrics for the user.
     */
    private function getRiskMetrics($userId)
    {
        $positions = TradingPosition::where('user_id', $userId)
            ->where('status', 'CLOSED')
            ->get();
        
        // Calculate maximum drawdown
        $maxDrawdown = $this->calculateMaxDrawdown($positions);
        
        // Calculate Sharpe ratio
        $sharpeRatio = $this->calculateSharpeRatio($positions);
        
        // Calculate Sortino ratio (focuses on downside risk)
        $sortinoRatio = $this->calculateSortinoRatio($positions);
        
        // Calculate Value at Risk (VaR)
        $valueAtRisk = $this->calculateValueAtRisk($positions);
        
        return [
            'maxDrawdown' => $maxDrawdown,
            'sharpeRatio' => $sharpeRatio,
            'sortinoRatio' => $sortinoRatio,
            'valueAtRisk' => $valueAtRisk,
        ];
    }
    
    /**
     * Calculate maximum drawdown from position history.
     */
    private function calculateMaxDrawdown($positions)
    {
        if ($positions->isEmpty()) {
            return [
                'value' => 0,
                'percentage' => 0,
                'startDate' => null,
                'endDate' => null,
                'recoveryDate' => null,
                'duration' => 0,
            ];
        }
        
        // Group positions by date and calculate daily P&L
        $dailyPnL = [];
        foreach ($positions as $position) {
            $date = Carbon::parse($position->exit_time)->format('Y-m-d');
            if (!isset($dailyPnL[$date])) {
                $dailyPnL[$date] = 0;
            }
            $dailyPnL[$date] += $position->profit_loss;
        }
        
        // Sort by date
        ksort($dailyPnL);
        
        // Calculate cumulative P&L
        $cumulativePnL = [];
        $runningTotal = 0;
        foreach ($dailyPnL as $date => $pnl) {
            $runningTotal += $pnl;
            $cumulativePnL[$date] = $runningTotal;
        }
        
        // Find maximum drawdown
        $maxDrawdown = 0;
        $maxDrawdownPercentage = 0;
        $peak = 0;
        $peakDate = array_key_first($cumulativePnL);
        $valley = 0;
        $valleyDate = $peakDate;
        $recoveryDate = null;
        
        foreach ($cumulativePnL as $date => $value) {
            if ($value > $peak) {
                // New peak
                $peak = $value;
                $peakDate = $date;
                // Reset valley
                $valley = $value;
                $valleyDate = $date;
            } elseif ($value < $valley) {
                // New valley
                $valley = $value;
                $valleyDate = $date;
                
                // Calculate drawdown
                $drawdown = $peak - $valley;
                $drawdownPercentage = $peak > 0 ? ($drawdown / $peak) * 100 : 0;
                
                if ($drawdown > $maxDrawdown) {
                    $maxDrawdown = $drawdown;
                    $maxDrawdownPercentage = $drawdownPercentage;
                    $recoveryDate = null; // Reset recovery date
                }
            } elseif ($value >= $peak && $maxDrawdown > 0 && !$recoveryDate) {
                // Recovery to previous peak
                $recoveryDate = $date;
            }
        }
        
        // Calculate drawdown duration
        $startDate = Carbon::parse($peakDate);
        $endDate = Carbon::parse($valleyDate);
        $duration = $startDate->diffInDays($endDate);
        
        return [
            'value' => $maxDrawdown,
            'percentage' => $maxDrawdownPercentage,
            'startDate' => $peakDate,
            'endDate' => $valleyDate,
            'recoveryDate' => $recoveryDate,
            'duration' => $duration,
        ];
    }
    
    /**
     * Calculate Sharpe ratio from position history.
     */
    private function calculateSharpeRatio($positions)
    {
        if ($positions->isEmpty()) {
            return 0;
        }
        
        // Group positions by date and calculate daily returns
        $dailyReturns = [];
        foreach ($positions as $position) {
            $date = Carbon::parse($position->exit_time)->format('Y-m-d');
            if (!isset($dailyReturns[$date])) {
                $dailyReturns[$date] = 0;
            }
            $dailyReturns[$date] += $position->profit_loss;
        }
        
        // Calculate average return and standard deviation
        $returns = array_values($dailyReturns);
        $avgReturn = array_sum($returns) / count($returns);
        
        $variance = 0;
        foreach ($returns as $return) {
            $variance += pow($return - $avgReturn, 2);
        }
        $stdDev = sqrt($variance / count($returns));
        
        // Assume risk-free rate is 0 for simplicity
        $sharpeRatio = $stdDev > 0 ? ($avgReturn / $stdDev) * sqrt(252) : 0; // Annualized
        
        return $sharpeRatio;
    }
    
    /**
     * Calculate Sortino ratio from position history (focuses on downside risk).
     */
    private function calculateSortinoRatio($positions)
    {
        if ($positions->isEmpty()) {
            return 0;
        }
        
        // Group positions by date and calculate daily returns
        $dailyReturns = [];
        foreach ($positions as $position) {
            $date = Carbon::parse($position->exit_time)->format('Y-m-d');
            if (!isset($dailyReturns[$date])) {
                $dailyReturns[$date] = 0;
            }
            $dailyReturns[$date] += $position->profit_loss;
        }
        
        // Calculate average return and downside deviation
        $returns = array_values($dailyReturns);
        $avgReturn = array_sum($returns) / count($returns);
        
        $downsideVariance = 0;
        $downsideCount = 0;
        foreach ($returns as $return) {
            if ($return < 0) {
                $downsideVariance += pow($return, 2);
                $downsideCount++;
            }
        }
        
        $downsideDeviation = $downsideCount > 0 ? sqrt($downsideVariance / $downsideCount) : 0;
        
        // Assume risk-free rate is 0 for simplicity
        $sortinoRatio = $downsideDeviation > 0 ? ($avgReturn / $downsideDeviation) * sqrt(252) : 0; // Annualized
        
        return $sortinoRatio;
    }
    
    /**
     * Calculate Value at Risk (VaR) from position history.
     */
    private function calculateValueAtRisk($positions)
    {
        if ($positions->isEmpty()) {
            return [
                'daily95' => 0,
                'daily99' => 0,
                'weekly95' => 0,
            ];
        }
        
        // Group positions by date and calculate daily returns
        $dailyReturns = [];
        foreach ($positions as $position) {
            $date = Carbon::parse($position->exit_time)->format('Y-m-d');
            if (!isset($dailyReturns[$date])) {
                $dailyReturns[$date] = 0;
            }
            $dailyReturns[$date] += $position->profit_loss;
        }
        
        // Sort returns in ascending order
        $returns = array_values($dailyReturns);
        sort($returns);
        
        // Calculate VaR at 95% and 99% confidence levels
        $count = count($returns);
        $index95 = (int)($count * 0.05);
        $index99 = (int)($count * 0.01);
        
        $var95 = $count > 0 ? abs($returns[$index95]) : 0;
        $var99 = $count > 0 ? abs($returns[$index99]) : 0;
        
        // Calculate weekly VaR (approximate as daily * sqrt(5))
        $weeklyVar95 = $var95 * sqrt(5);
        
        return [
            'daily95' => $var95,
            'daily99' => $var99,
            'weekly95' => $weeklyVar95,
        ];
    }
    
    /**
     * Get drawdown alerts for the user.
     */
    public function getDrawdownAlerts($userId)
    {
        $user = User::find($userId);
        $activeWallet = $user->activeTradeWallet();
        
        if (!$activeWallet) {
            return [
                'currentDrawdown' => 0,
                'maxAllowedDrawdown' => 0,
                'alerts' => [],
            ];
        }
        
        // Get open positions
        $openPositions = TradingPosition::where('user_id', $userId)
            ->where('status', 'OPEN')
            ->get();
        
        // Calculate current unrealized drawdown
        $unrealizedPnL = $openPositions->sum('profit_loss');
        $accountBalance = $activeWallet->balance;
        $currentDrawdown = $unrealizedPnL < 0 ? abs($unrealizedPnL) : 0;
        $currentDrawdownPercentage = $accountBalance > 0 ? ($currentDrawdown / $accountBalance) * 100 : 0;
        
        // Define max allowed drawdown (default to 20% if not set)
        $maxAllowedDrawdown = $user->max_drawdown_percentage ?? 20;
        
        // Generate alerts based on drawdown thresholds
        $alerts = [];
        
        if ($currentDrawdownPercentage >= $maxAllowedDrawdown) {
            $alerts[] = [
                'level' => 'critical',
                'message' => 'Maximum drawdown threshold exceeded. Consider closing some positions to reduce risk.',
                'percentage' => $currentDrawdownPercentage,
                'timestamp' => now()->toDateTimeString(),
            ];
        } elseif ($currentDrawdownPercentage >= $maxAllowedDrawdown * 0.75) {
            $alerts[] = [
                'level' => 'warning',
                'message' => 'Drawdown approaching maximum threshold. Review open positions and risk exposure.',
                'percentage' => $currentDrawdownPercentage,
                'timestamp' => now()->toDateTimeString(),
            ];
        } elseif ($currentDrawdownPercentage >= $maxAllowedDrawdown * 0.5) {
            $alerts[] = [
                'level' => 'caution',
                'message' => 'Moderate drawdown detected. Monitor positions closely.',
                'percentage' => $currentDrawdownPercentage,
                'timestamp' => now()->toDateTimeString(),
            ];
        }
        
        // Check for individual position drawdowns
        foreach ($openPositions as $position) {
            $entryPrice = $position->entry_price;
            $currentPrice = $position->current_price ?? $entryPrice; // Fallback to entry price if current not available
            
            if ($entryPrice > 0 && $currentPrice > 0) {
                $positionDrawdown = 0;
                
                if ($position->trade_type === 'BUY' && $currentPrice < $entryPrice) {
                    $positionDrawdown = (($entryPrice - $currentPrice) / $entryPrice) * 100;
                } elseif ($position->trade_type === 'SELL' && $currentPrice > $entryPrice) {
                    $positionDrawdown = (($currentPrice - $entryPrice) / $entryPrice) * 100;
                }
                
                if ($positionDrawdown >= 10) {
                    $alerts[] = [
                        'level' => 'position',
                        'message' => "Position {$position->currency_pair} has a significant drawdown of {$positionDrawdown}%.",
                        'percentage' => $positionDrawdown,
                        'position_id' => $position->id,
                        'timestamp' => now()->toDateTimeString(),
                    ];
                }
            }
        }
        
        return [
            'currentDrawdown' => $currentDrawdown,
            'currentDrawdownPercentage' => $currentDrawdownPercentage,
            'maxAllowedDrawdown' => $maxAllowedDrawdown,
            'alerts' => $alerts,
        ];
    }
    
    /**
     * Update user's risk settings.
     */
    public function updateRiskSettings(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'risk_percentage' => 'required|numeric|min:0.1|max:10',
            'max_drawdown_percentage' => 'required|numeric|min:5|max:50',
        ]);
        
        $user->update([
            'risk_percentage' => $validated['risk_percentage'],
            'max_drawdown_percentage' => $validated['max_drawdown_percentage'],
        ]);
        
        return redirect()->back()->with('success', 'Risk settings updated successfully.');
    }
    
    /**
     * Calculate position size based on risk parameters.
     */
    public function calculatePositionSize(Request $request)
    {
        $validated = $request->validate([
            'account_balance' => 'required|numeric|min:1',
            'risk_percentage' => 'required|numeric|min:0.1|max:10',
            'entry_price' => 'required|numeric|min:0.00001',
            'stop_loss' => 'required|numeric|min:0.00001',
            'currency_pair' => 'required|string',
        ]);
        
        $accountBalance = $validated['account_balance'];
        $riskPercentage = $validated['risk_percentage'];
        $entryPrice = $validated['entry_price'];
        $stopLoss = $validated['stop_loss'];
        $currencyPair = $validated['currency_pair'];
        
        // Calculate risk amount
        $riskAmount = $accountBalance * ($riskPercentage / 100);
        
        // Get pip size (e.g., 0.0001 or 0.01)
        $pipSize = $this->getPipSize($currencyPair); // Renamed for clarity
        
        if ($pipSize <= 0) {
             Log::error("Invalid pip size calculated for pair: {$currencyPair}");
             return response()->json(['error' => 'Invalid currency pair configuration'], 400);
        }
        
        // Calculate stop loss in pips
        $stopLossPips = abs($entryPrice - $stopLoss) / $pipSize;
        
        // Get approximate USD value of 1 pip per standard lot
        $pipValuePerLot = $this->getApproximatePipValuePerLotInUSD($currencyPair, $pipSize);
        
        if ($pipValuePerLot <= 0) {
             Log::error("Invalid pip value per lot calculated for pair: {$currencyPair}");
             return response()->json(['error' => 'Could not determine pip value for the pair'], 400);
        }
        
        // Calculate position size in standard lots
        $standardLots = 0;
        if ($stopLossPips > 0) {
            // Correct formula: Risk Amount / (Stop Loss in Pips * Value per Pip per Lot)
            $standardLots = $riskAmount / ($stopLossPips * $pipValuePerLot);
        }
        
        // Convert to other lot sizes and units
        $miniLots = $standardLots * 10;
        $microLots = $standardLots * 100;
        $positionSizeUnits = $standardLots * 100000; // Standard Lot = 100,000 units
        
        return response()->json([
            'riskAmount' => $riskAmount,
            'stopLossPips' => $stopLossPips,
            'positionSize' => $positionSizeUnits, // In currency units
            'standardLots' => $standardLots,
            'miniLots' => $miniLots,
            'microLots' => $microLots,
        ]);
    }
    
    /**
     * Get pip size for a currency pair (e.g., 0.0001 or 0.01).
     * Renamed from getPipValue for clarity
     */
    private function getPipSize($currencyPair)
    {
        // JPY pairs typically have 2 decimal places for pip size
        $isJpyPair = str_contains($currencyPair, 'JPY');
        $defaultPipSize = $isJpyPair ? 0.01 : 0.0001;
        
        // You might have a more robust way to get this from config or DB
        $pipSizes = [
            'EUR/USD' => 0.0001,
            'GBP/USD' => 0.0001,
            'USD/JPY' => 0.01,
            'USD/CHF' => 0.0001,
            'AUD/USD' => 0.0001,
            'NZD/USD' => 0.0001,
            'USD/CAD' => 0.0001,
            'EUR/GBP' => 0.0001,
            'EUR/JPY' => 0.01,
            'GBP/JPY' => 0.01,
            // Add other pairs as needed
        ];
        
        return $pipSizes[$currencyPair] ?? $defaultPipSize;
    }
    
    /**
     * Get the approximate monetary value (in USD) of 1 pip for 1 standard lot.
     * NOTE: Uses approximate exchange rates. Fetching live rates is better for production.
     */
    private function getApproximatePipValuePerLotInUSD($currencyPair, $pipSize)
    {
        $lotSizeUnits = 100000;
        $parts = explode('/', $currencyPair);
        if (count($parts) !== 2) {
            return 0; // Invalid pair format
        }
        $baseCurrency = $parts[0];
        $quoteCurrency = $parts[1];
        
        // Approximate current exchange rates (replace with live data ideally)
        $approxRates = [
            'USD/JPY' => 155.0, // Example rate
            'USD/CHF' => 0.91,
            'USD/CAD' => 1.37,
            'GBP/USD' => 1.25,
            'EUR/USD' => 1.07,
            // Add inverses or other rates as needed for cross calculations
            'JPY/USD' => 1 / 155.0,
            'CHF/USD' => 1 / 0.91,
            'CAD/USD' => 1 / 1.37,
        ];
        
        if ($quoteCurrency === 'USD') {
            // e.g., EUR/USD - Pip value is fixed at $10 for 0.0001 pip size
            return $pipSize * $lotSizeUnits;
        } elseif ($baseCurrency === 'USD') {
            // e.g., USD/JPY - Need the current rate to convert pip value to USD
            $rate = $approxRates[$currencyPair] ?? null;
            if ($rate && $rate > 0) {
                return ($pipSize * $lotSizeUnits) / $rate;
            }
        } else {
            // Cross pair, e.g., EUR/GBP - Need Quote/USD rate
            $quoteToUsdPair = $quoteCurrency . '/USD';
            $rate = $approxRates[$quoteToUsdPair] ?? null;
            
            // Handle JPY quote specifically if needed (JPY/USD approx 1/150)
            if ($quoteCurrency === 'JPY') {
                 $rate = $approxRates['JPY/USD'] ?? (1 / 155.0); // Use direct approx rate
            }
            
            if ($rate && $rate > 0) {
                return ($pipSize * $lotSizeUnits) * $rate;
            }
        }
        
        Log::warning("Could not determine approximate pip value in USD for pair: {$currencyPair}");
        return 0; // Indicate failure
    }
}
