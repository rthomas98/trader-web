<?php

namespace App\Services;

use App\Models\User;
use App\Models\TradingPosition;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TradingStatsService
{
    /**
     * Calculate various trading statistics for a given user based on closed positions.
     *
     * @param User $user
     * @return array<string, mixed>
     */
    public function calculateStats(User $user): array
    {
        // Fetch closed positions with necessary data
        $closedPositions = TradingPosition::where('user_id', $user->id)
            ->where('status', 'closed')
            ->whereNotNull('profit_loss')
            ->whereNotNull('entry_time')
            ->whereNotNull('exit_time')
            ->select('profit_loss', 'entry_time', 'exit_time')
            ->orderBy('exit_time', 'asc') // Ensure chronological order for stats consistency
            ->get();

        if ($closedPositions->isEmpty()) {
            return $this->getDefaultStats();
        }

        $totalTrades = $closedPositions->count();
        $totalProfitLoss = $closedPositions->sum('profit_loss');

        $winningTrades = $closedPositions->where('profit_loss', '>', 0);
        $losingTrades = $closedPositions->where('profit_loss', '<', 0);

        $countWinning = $winningTrades->count();
        
        $grossProfit = $winningTrades->sum('profit_loss');
        // Ensure gross loss is positive for profit factor calculation
        $grossLoss = $losingTrades->sum(fn ($trade) => abs($trade->profit_loss)); 

        // Calculate Win Rate
        $winRate = $totalTrades > 0 ? ($countWinning / $totalTrades) * 100 : 0;

        // Calculate Profit Factor
        $profitFactor = $grossLoss > 0 ? $grossProfit / $grossLoss : null; 
        if ($grossProfit > 0 && $grossLoss == 0) {
             $profitFactor = INF; 
        }

        // Calculate Average Profit/Trade
        $avgProfitPerTrade = $totalTrades > 0 ? $totalProfitLoss / $totalTrades : 0;

        // Calculate Average Trade Duration
        $totalDurationSeconds = $closedPositions->sum(function ($trade) {
            $entry = Carbon::parse($trade->entry_time);
            $exit = Carbon::parse($trade->exit_time);
            return $exit->diffInSeconds($entry);
        });
        $avgDurationHours = $totalTrades > 0 ? ($totalDurationSeconds / $totalTrades) / 3600 : 0; 

        return [
            'total_trades' => $totalTrades,
            'total_profit_loss' => (float) $totalProfitLoss,
            'win_rate' => round($winRate, 2),
            'profit_factor' => is_infinite($profitFactor ?? 0) ? '∞' : ($profitFactor !== null ? round($profitFactor, 2) : 'N/A'), 
            'avg_profit_per_trade' => round($avgProfitPerTrade, 2),
            'avg_trade_duration_hours' => round($avgDurationHours, 2), 
        ];
    }

    /**
     * Returns default statistics for users with no closed trades.
     *
     * @return array<string, mixed>
     */
    private function getDefaultStats(): array
    {
        return [
            'total_trades' => 0,
            'total_profit_loss' => 0.0,
            'win_rate' => 0.0,
            'profit_factor' => 'N/A',
            'avg_profit_per_trade' => 0.0,
            'avg_trade_duration_hours' => 0.0,
        ];
    }

    /**
     * Get data formatted for the performance chart (equity curve).
     *
     * @param User $user
     * @return array<string, mixed>
     */
    public function getPerformanceChartData(User $user): array
    {
        $closedPositions = TradingPosition::where('user_id', $user->id)
            ->where('status', 'closed')
            ->whereNotNull('profit_loss')
            ->whereNotNull('exit_time')
            ->select('profit_loss', 'exit_time')
            ->orderBy('exit_time', 'asc')
            ->get();

        if ($closedPositions->isEmpty()) {
            return [
                'series' => [['name' => 'Equity Curve', 'data' => []]],
                'categories' => []
            ];
        }

        $cumulativeProfit = 0;
        $chartData = [];
        $categories = [];

        foreach ($closedPositions as $position) {
            $cumulativeProfit += $position->profit_loss;
            $exitTime = Carbon::parse($position->exit_time);
            // Format for ApexCharts: [timestamp, value]
            $chartData[] = [$exitTime->timestamp * 1000, round($cumulativeProfit, 2)]; 
            // We use timestamp for the data series, categories can be formatted date strings if needed for display
            // For simplicity, we'll rely on ApexCharts datetime axis formatting
        }

        return [
            'series' => [
                ['name' => 'Equity Curve', 'data' => $chartData]
            ],
            // Categories are automatically handled by ApexCharts when using datetime type for x-axis
        ];
    }
}
