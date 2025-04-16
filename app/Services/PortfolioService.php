<?php

namespace App\Services;

use App\Models\PortfolioPosition;
use App\Models\User;
use App\Models\TradingPosition;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class PortfolioService
{
    protected $marketDataService;

    /**
     * Create a new service instance.
     */
    public function __construct(MarketDataService $marketDataService)
    {
        $this->marketDataService = $marketDataService;
    }

    /**
     * Add a new position to the portfolio.
     *
     * @param User $user
     * @param array $positionData
     * @return PortfolioPosition
     */
    public function addPosition(User $user, array $positionData): PortfolioPosition
    {
        return DB::transaction(function () use ($user, $positionData) {
            // Check if position already exists
            $existingPosition = PortfolioPosition::where('user_id', $user->id)
                ->where('symbol', $positionData['symbol'])
                ->first();
                
            if ($existingPosition) {
                // Update existing position (average down/up)
                $totalQuantity = $existingPosition->quantity + $positionData['quantity'];
                $totalValue = ($existingPosition->quantity * $existingPosition->average_price) + 
                              ($positionData['quantity'] * $positionData['average_price']);
                
                $existingPosition->quantity = $totalQuantity;
                $existingPosition->average_price = $totalValue / $totalQuantity;
                
                // Update category and notes if provided
                if (isset($positionData['category'])) {
                    $existingPosition->category = $positionData['category'];
                }
                
                if (isset($positionData['notes'])) {
                    $existingPosition->notes = $positionData['notes'];
                }
                
                $existingPosition->save();
                
                return $existingPosition;
            } else {
                // Create new position
                $position = new PortfolioPosition([
                    'user_id' => $user->id,
                    'symbol' => $positionData['symbol'],
                    'name' => $positionData['name'] ?? $positionData['symbol'],
                    'quantity' => $positionData['quantity'],
                    'average_price' => $positionData['average_price'],
                    'category' => $positionData['category'] ?? 'Other',
                    'notes' => $positionData['notes'] ?? null,
                ]);
                
                $position->save();
                
                return $position;
            }
        });
    }
    
    /**
     * Update a portfolio position.
     *
     * @param PortfolioPosition $position
     * @param array $positionData
     * @return PortfolioPosition
     */
    public function updatePosition(PortfolioPosition $position, array $positionData): PortfolioPosition
    {
        return DB::transaction(function () use ($position, $positionData) {
            // Update position data
            if (isset($positionData['name'])) {
                $position->name = $positionData['name'];
            }
            
            if (isset($positionData['quantity'])) {
                $position->quantity = $positionData['quantity'];
            }
            
            if (isset($positionData['average_price'])) {
                $position->average_price = $positionData['average_price'];
            }
            
            if (isset($positionData['category'])) {
                $position->category = $positionData['category'];
            }
            
            if (isset($positionData['notes'])) {
                $position->notes = $positionData['notes'];
            }
            
            $position->save();
            
            return $position;
        });
    }
    
    /**
     * Remove a position from the portfolio.
     *
     * @param PortfolioPosition $position
     * @return bool
     */
    public function removePosition(PortfolioPosition $position): bool
    {
        return $position->delete();
    }
    
    /**
     * Get portfolio summary for a user.
     *
     * @param User $user
     * @return array
     */
    public function getPortfolioSummary(User $user): array
    {
        $positions = PortfolioPosition::where('user_id', $user->id)->get();
        
        $summary = [
            'total_value' => 0,
            'total_cost' => 0,
            'total_profit_loss' => 0,
            'total_profit_loss_percentage' => 0,
            'positions_count' => $positions->count(),
            'categories' => [],
            'positions' => [],
        ];
        
        $categoriesData = [];
        
        foreach ($positions as $position) {
            $currentPrice = $this->marketDataService->getCurrentPrice($position->symbol);
            $currentValue = $currentPrice * $position->quantity;
            $cost = $position->average_price * $position->quantity;
            $profitLoss = $currentValue - $cost;
            $profitLossPercentage = $cost > 0 ? ($profitLoss / $cost) * 100 : 0;
            
            // Add to summary totals
            $summary['total_value'] += $currentValue;
            $summary['total_cost'] += $cost;
            $summary['total_profit_loss'] += $profitLoss;
            
            // Add to category data
            $category = $position->category ?? 'Other';
            if (!isset($categoriesData[$category])) {
                $categoriesData[$category] = [
                    'value' => 0,
                    'cost' => 0,
                    'profit_loss' => 0,
                    'count' => 0,
                ];
            }
            
            $categoriesData[$category]['value'] += $currentValue;
            $categoriesData[$category]['cost'] += $cost;
            $categoriesData[$category]['profit_loss'] += $profitLoss;
            $categoriesData[$category]['count']++;
            
            // Add position details
            $summary['positions'][] = [
                'id' => $position->id,
                'symbol' => $position->symbol,
                'name' => $position->name,
                'quantity' => $position->quantity,
                'average_price' => $position->average_price,
                'current_price' => $currentPrice,
                'current_value' => $currentValue,
                'cost' => $cost,
                'profit_loss' => $profitLoss,
                'profit_loss_percentage' => $profitLossPercentage,
                'category' => $category,
                'notes' => $position->notes,
            ];
        }
        
        // Calculate total profit/loss percentage
        $summary['total_profit_loss_percentage'] = $summary['total_cost'] > 0 
            ? ($summary['total_profit_loss'] / $summary['total_cost']) * 100 
            : 0;
            
        // Format category data for the summary
        foreach ($categoriesData as $category => $data) {
            $summary['categories'][] = [
                'name' => $category,
                'value' => $data['value'],
                'cost' => $data['cost'],
                'profit_loss' => $data['profit_loss'],
                'profit_loss_percentage' => $data['cost'] > 0 ? ($data['profit_loss'] / $data['cost']) * 100 : 0,
                'percentage_of_portfolio' => $summary['total_value'] > 0 ? ($data['value'] / $summary['total_value']) * 100 : 0,
                'count' => $data['count'],
            ];
        }
        
        return $summary;
    }
    
    /**
     * Import positions from a CSV file.
     *
     * @param User $user
     * @param array $positions
     * @return array
     */
    public function importPositions(User $user, array $positions): array
    {
        $results = [
            'success' => true,
            'imported' => 0,
            'failed' => 0,
            'errors' => [],
        ];
        
        DB::transaction(function () use ($user, $positions, &$results) {
            foreach ($positions as $index => $positionData) {
                try {
                    // Validate required fields
                    if (empty($positionData['symbol']) || 
                        !isset($positionData['quantity']) || 
                        !isset($positionData['average_price'])) {
                        throw new \Exception('Missing required fields (symbol, quantity, or average_price)');
                    }
                    
                    // Add position
                    $this->addPosition($user, $positionData);
                    
                    $results['imported']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'row' => $index + 1,
                        'message' => $e->getMessage(),
                        'data' => $positionData,
                    ];
                }
            }
        });
        
        $results['success'] = $results['failed'] === 0;
        
        return $results;
    }
    
    /**
     * Get portfolio performance over time.
     *
     * @param User $user
     * @param string $timeframe
     * @return array
     */
    public function getPortfolioPerformance(User $user, string $timeframe = '1m'): array
    {
        $positions = PortfolioPosition::where('user_id', $user->id)->get();

        // Calculate monthly performance for the last 12 months
        $performance = [];
        $endDate = now()->endOfMonth(); // End of the current month

        for ($i = 0; $i < 12; $i++) {
            // Go back month by month, considering the end of each month
            $date = $endDate->copy()->subMonthsNoOverflow($i)->endOfMonth();
            $monthStr = $date->format('M Y'); // Format like 'Apr 2025'

            $monthlyValue = 0;

            foreach ($positions as $position) {
                // In a real app, fetch historical price for the end of this month
                // For demo, simulate price based on current price and time difference
                $currentPrice = $this->marketDataService->getCurrentPrice($position->symbol);
                
                // Simple simulation: Assume price volatility decreases further back in time
                // This simulation is basic and should be replaced with actual historical data fetching
                $monthsAgo = $i;
                $volatilityFactor = 1 + (mt_rand(-50, 50) / 1000) * ($monthsAgo + 1); // Simulate +/- 5% volatility per month back
                $historicalPrice = $currentPrice * $volatilityFactor;

                $monthlyValue += $historicalPrice * $position->quantity;
            }

            $performance[] = [
                'month' => $monthStr,
                'total' => round($monthlyValue, 2), // Use 'total' to match frontend interface
            ];
        }

        // Reverse the array so the oldest month is first
        return array_reverse($performance);
    }

    /**
     * Get portfolio allocation by category.
     *
     * @param User $user
     * @return array
     */
    public function getPortfolioAllocation(User $user): array
    {
        $summary = $this->getPortfolioSummary($user);
        
        // Sort categories by value
        usort($summary['categories'], function ($a, $b) {
            return $b['value'] <=> $a['value'];
        });
        
        return $summary['categories'];
    }

    /**
     * Get recent closed trades for a user.
     *
     * @param User $user
     * @param int $limit
     * @return array
     */
    public function getRecentClosedTrades(User $user, int $limit = 4): array
    {
        $trades = TradingPosition::where('user_id', $user->id)
            ->where('status', 'CLOSED') // Assuming 'CLOSED' status
            ->orderBy('closed_at', 'desc') // Assuming 'closed_at' timestamp field
            ->limit($limit)
            ->get();

        return $trades->map(function ($trade) {
            $profitValue = $trade->profit_loss ?? 0;
            $profitFormatted = sprintf('%s$%s', $profitValue >= 0 ? '+' : '-', number_format(abs($profitValue), 2));
            $closedAt = Carbon::parse($trade->closed_at);

            return [
                // Use 'pair' for consistency with frontend interface
                'pair' => $trade->symbol ?? $trade->currency_pair ?? 'N/A',
                'type' => $trade->trade_type === 'BUY' ? 'Buy' : 'Sell',
                'amount' => number_format($trade->quantity ?? 0, 2),
                // Use 'price' for consistency
                'price' => number_format($trade->exit_price ?? 0, $this->getDecimalPlaces($trade->symbol)),
                'profit' => $profitFormatted,
                'timestamp' => $this->getTimeAgo($closedAt),
            ];
        })->toArray();
    }

    /**
     * Helper function to format time ago strings.
     *
     * @param Carbon $date
     * @return string
     */
    private function getTimeAgo(Carbon $date): string
    {
        return $date->diffForHumans(); // Use Carbon's built-in diffForHumans
    }
    
    /**
     * Helper function to determine decimal places based on symbol (simplified).
     * In a real app, this might come from symbol metadata.
     *
     * @param string|null $symbol
     * @return int
     */
    private function getDecimalPlaces(?string $symbol): int
    {
        // Basic heuristic: JPY pairs usually have 3, others often 5 for Forex, crypto varies
        if (str_contains($symbol ?? '', 'JPY')) {
            return 3;
        }
        if (str_contains($symbol ?? '', 'USD') || str_contains($symbol ?? '', 'EUR') || str_contains($symbol ?? '', 'GBP') || str_contains($symbol ?? '', 'AUD') || str_contains($symbol ?? '', 'CAD') || str_contains($symbol ?? '', 'CHF')) {
            // Common Forex pairs often use 5 decimal places
             if (strlen($symbol) > 6) { // Likely Crypto e.g., BTC/USD
                 return 2; // Default for crypto vs fiat
             } 
             return 5;
        }
        // Default for indices, stocks, or unknown crypto
        return 2; 
    }
}
