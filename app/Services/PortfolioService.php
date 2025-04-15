<?php

namespace App\Services;

use App\Models\PortfolioPosition;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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
        
        // Determine days based on timeframe
        $days = 30;
        switch ($timeframe) {
            case '1w':
                $days = 7;
                break;
            case '1m':
                $days = 30;
                break;
            case '3m':
                $days = 90;
                break;
            case '6m':
                $days = 180;
                break;
            case '1y':
                $days = 365;
                break;
            case 'ytd':
                $days = now()->dayOfYear;
                break;
        }
        
        // Generate daily performance data
        $performance = [];
        $startDate = now()->subDays($days);
        
        for ($i = 0; $i <= $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dateStr = $date->format('Y-m-d');
            
            $dailyValue = 0;
            $dailyCost = 0;
            
            foreach ($positions as $position) {
                // In a real app, we would fetch historical prices for this date
                // For demo, we'll generate a reasonable price based on current price
                $currentPrice = $this->marketDataService->getCurrentPrice($position->symbol);
                $volatility = mt_rand(-150, 150) / 1000; // -15% to +15%
                $factor = 1 + ($volatility * ($days - $i) / $days);
                $historicalPrice = $currentPrice * $factor;
                
                $dailyValue += $historicalPrice * $position->quantity;
                $dailyCost += $position->average_price * $position->quantity;
            }
            
            $performance[] = [
                'date' => $dateStr,
                'value' => $dailyValue,
                'cost' => $dailyCost,
                'profit_loss' => $dailyValue - $dailyCost,
                'profit_loss_percentage' => $dailyCost > 0 ? (($dailyValue - $dailyCost) / $dailyCost) * 100 : 0,
            ];
        }
        
        return $performance;
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
}
