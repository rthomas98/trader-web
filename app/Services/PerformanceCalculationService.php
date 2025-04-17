<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class PerformanceCalculationService
{
    /**
     * Calculate performance metrics based on trades and initial capital.
     *
     * @param array $trades List of trades (e.g., [['type', 'entry_timestamp', 'entry_price', 'exit_timestamp'?, 'exit_price'?], ...])
     * @param float $initialCapital The starting capital for the backtest.
     * @return array An array of performance metrics.
     */
    public function calculatePerformance(array $trades, float $initialCapital): array
    {
        Log::info('Calculating performance metrics...', ['trade_count' => count($trades), 'initial_capital' => $initialCapital]);

        $totalTrades = 0;
        $netProfit = 0;
        $winningTrades = 0;
        $losingTrades = 0;

        foreach ($trades as $trade) {
            // Ensure the trade is closed and has necessary prices
            if (empty($trade['exit_price']) || empty($trade['entry_price'])) {
                Log::debug('Skipping trade due to missing entry/exit price.', ['trade' => $trade]);
                continue;
            }

            $totalTrades++;
            $entryPrice = (float)$trade['entry_price'];
            $exitPrice = (float)$trade['exit_price'];
            $tradeProfitLoss = 0;

            // TODO: Implement proper position sizing based on capital/risk later.
            // For now, assume 1 unit per trade for simplicity.
            if ($trade['type'] === 'buy') {
                $tradeProfitLoss = $exitPrice - $entryPrice;
            } elseif ($trade['type'] === 'sell') {
                $tradeProfitLoss = $entryPrice - $exitPrice;
            }

            $netProfit += $tradeProfitLoss;

            if ($tradeProfitLoss > 0) {
                $winningTrades++;
            } elseif ($tradeProfitLoss < 0) {
                $losingTrades++;
            }
        }

        $winRate = ($totalTrades > 0) ? ($winningTrades / $totalTrades) * 100 : 0;
        $finalCapital = $initialCapital + $netProfit;

        $metrics = [
            'initialCapital' => $initialCapital,
            'finalCapital' => $finalCapital,
            'netProfit' => $netProfit,
            'netProfitPercentage' => $initialCapital != 0 ? ($netProfit / $initialCapital) * 100 : 0,
            'totalTrades' => $totalTrades,
            'winningTrades' => $winningTrades,
            'losingTrades' => $losingTrades,
            'winRate' => $winRate,
            // TODO: Add more metrics: Max Drawdown, Profit Factor, Sharpe Ratio, etc.
        ];

        Log::info('Performance metrics calculated.', $metrics);

        return $metrics;
    }
}
