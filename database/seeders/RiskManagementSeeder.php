<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\TradingPosition;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RiskManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users
        $users = User::all();

        foreach ($users as $user) {
            // Set risk management settings for each user
            $user->update([
                'risk_percentage' => rand(1, 5) / 2, // 0.5 to 2.5%
                'max_drawdown_percentage' => rand(10, 30), // 10% to 30%
                'risk_tolerance_level' => $this->getRandomRiskLevel(),
            ]);

            // Create sample trading positions with risk management data
            $this->createSamplePositions($user);
        }
    }

    /**
     * Get a random risk tolerance level
     */
    private function getRandomRiskLevel(): string
    {
        $levels = ['conservative', 'moderate', 'aggressive'];
        return $levels[array_rand($levels)];
    }

    /**
     * Create sample trading positions with risk management data
     */
    private function createSamplePositions(User $user): void
    {
        // Only create positions if the user doesn't have many already
        if ($user->tradingPositions()->count() < 5) {
            $currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
            $now = Carbon::now();
            
            // Create 10-20 positions for each user
            $positionCount = rand(10, 20);
            
            for ($i = 0; $i < $positionCount; $i++) {
                $isOpen = rand(0, 10) < 3; // 30% chance of being open
                $entryDate = $now->copy()->subDays(rand(1, 60));
                $exitDate = $isOpen ? null : $entryDate->copy()->addHours(rand(1, 72));
                
                $currencyPair = $currencyPairs[array_rand($currencyPairs)];
                $direction = rand(0, 1) ? 'BUY' : 'SELL';
                
                // Generate realistic prices based on currency pair
                $entryPrice = $this->getRealisticPrice($currencyPair);
                
                // Calculate stop loss and take profit with proper risk management
                $stopLossPips = rand(10, 50);
                $takeProfitPips = $stopLossPips * (rand(15, 30) / 10); // 1.5 to 3.0 times stop loss
                
                $pipValue = $this->getPipValue($currencyPair);
                $stopLoss = $direction === 'BUY' 
                    ? $entryPrice - ($stopLossPips * $pipValue)
                    : $entryPrice + ($stopLossPips * $pipValue);
                
                $takeProfit = $direction === 'BUY'
                    ? $entryPrice + ($takeProfitPips * $pipValue)
                    : $entryPrice - ($takeProfitPips * $pipValue);
                
                // Determine exit price and profit/loss
                $exitPrice = null;
                $profitLoss = null;
                
                if (!$isOpen) {
                    // Decide if the trade was a winner or loser
                    $isWinner = rand(0, 100) < 60; // 60% win rate
                    
                    if ($isWinner) {
                        // Exit price is between entry and take profit
                        $exitPrice = $direction === 'BUY'
                            ? $entryPrice + (rand(5, 95) / 100) * ($takeProfit - $entryPrice)
                            : $entryPrice - (rand(5, 95) / 100) * ($entryPrice - $takeProfit);
                    } else {
                        // Exit price is between entry and stop loss
                        $exitPrice = $direction === 'BUY'
                            ? $entryPrice - (rand(5, 95) / 100) * ($entryPrice - $stopLoss)
                            : $entryPrice + (rand(5, 95) / 100) * ($stopLoss - $entryPrice);
                    }
                    
                    // Calculate profit/loss
                    $priceDiff = abs($exitPrice - $entryPrice);
                    $pipsDiff = $priceDiff / $pipValue;
                    $lotSize = rand(1, 10) / 10; // 0.1 to 1.0 lots
                    
                    $profitLoss = $direction === 'BUY'
                        ? ($exitPrice > $entryPrice ? 1 : -1) * $pipsDiff * $lotSize * 10
                        : ($exitPrice < $entryPrice ? 1 : -1) * $pipsDiff * $lotSize * 10;
                }
                
                // Create the position
                TradingPosition::create([
                    'user_id' => $user->id,
                    'currency_pair' => $currencyPair,
                    'direction' => $direction,
                    'quantity' => rand(1, 10) / 10, // 0.1 to 1.0 lots
                    'entry_price' => $entryPrice,
                    'stop_loss' => $stopLoss,
                    'take_profit' => $takeProfit,
                    'exit_price' => $exitPrice,
                    'profit_loss' => $profitLoss,
                    'status' => $isOpen ? 'OPEN' : 'CLOSED',
                    'entry_time' => $entryDate,
                    'exit_time' => $exitDate,
                ]);
            }
        }
    }
    
    /**
     * Get a realistic price for a currency pair
     */
    private function getRealisticPrice(string $currencyPair): float
    {
        $basePrices = [
            'EUR/USD' => 1.0950,
            'GBP/USD' => 1.2550,
            'USD/JPY' => 150.50,
            'AUD/USD' => 0.6650,
            'USD/CAD' => 1.3650,
        ];
        
        $basePrice = $basePrices[$currencyPair] ?? 1.0000;
        $variation = $basePrice * 0.02; // 2% variation
        
        return $basePrice + (rand(-100, 100) / 100) * $variation;
    }
    
    /**
     * Get pip value for a currency pair
     */
    private function getPipValue(string $currencyPair): float
    {
        $pipValues = [
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
        ];
        
        return $pipValues[$currencyPair] ?? 0.0001;
    }
}
