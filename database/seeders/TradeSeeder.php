<?php

namespace Database\Seeders;

use App\Models\CopyTradingRelationship;
use App\Models\Trade;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TradeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Make sure we have some users
        if (User::count() < 5) {
            $this->command->info('Not enough users found. Please run UserSeeder first.');
            return;
        }

        // Get all users
        $users = User::all();
        
        // Currency pairs for forex trading
        $currencyPairs = [
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
            'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
            'EUR/JPY', 'GBP/JPY'
        ];
        
        // Create original trades for each user
        foreach ($users as $user) {
            // Create between 5-20 trades for each user
            $tradeCount = rand(5, 20);
            
            // Start date for trades (30 days ago)
            $startDate = Carbon::now()->subDays(30);
            
            // Create trades
            for ($i = 0; $i < $tradeCount; $i++) {
                // Random trade date between start date and now
                $openedAt = $startDate->copy()->addMinutes(rand(0, 30 * 24 * 60));
                $closedAt = $openedAt->copy()->addMinutes(rand(30, 24 * 60)); // Between 30 minutes and 24 hours later
                
                // Ensure closedAt is not in the future
                if ($closedAt->isFuture()) {
                    $closedAt = Carbon::now();
                }
                
                // Random currency pair
                $symbol = $currencyPairs[array_rand($currencyPairs)];
                
                // Random trade type
                $type = rand(0, 1) ? 'BUY' : 'SELL';
                
                // Random prices based on typical forex rates
                $basePrice = $this->getBasePrice($symbol);
                $priceDelta = $basePrice * (rand(1, 100) / 10000); // 0.01% to 1% change
                
                if ($type === 'BUY') {
                    $entryPrice = $basePrice;
                    $exitPrice = rand(0, 1) ? $basePrice + $priceDelta : $basePrice - $priceDelta;
                } else {
                    $entryPrice = $basePrice;
                    $exitPrice = rand(0, 1) ? $basePrice - $priceDelta : $basePrice + $priceDelta;
                }
                
                // Random lot size between 0.01 and 2.0
                $lotSize = round(rand(1, 200) / 100, 2);
                
                // Calculate profit/loss
                $pipValue = $this->calculatePipValue($symbol, $lotSize);
                $pips = abs($exitPrice - $entryPrice) * $this->getPipMultiplier($symbol);
                $profitDirection = ($type === 'BUY') ? 
                    ($exitPrice > $entryPrice ? 1 : -1) : 
                    ($exitPrice < $entryPrice ? 1 : -1);
                $profit = round($pips * $pipValue * $profitDirection, 2);
                
                // Create the trade
                Trade::create([
                    'user_id' => $user->id,
                    'symbol' => $symbol,
                    'type' => $type,
                    'entry_price' => $entryPrice,
                    'exit_price' => $exitPrice,
                    'lot_size' => $lotSize,
                    'profit' => $profit,
                    'stop_loss' => $entryPrice - ($type === 'BUY' ? rand(10, 50) / 10000 : -rand(10, 50) / 10000),
                    'take_profit' => $entryPrice + ($type === 'BUY' ? rand(20, 100) / 10000 : -rand(20, 100) / 10000),
                    'opened_at' => $openedAt,
                    'closed_at' => $closedAt,
                ]);
            }
        }
        
        // Create copied trades for existing copy trading relationships
        $relationships = CopyTradingRelationship::with(['trader', 'copier'])->get();
        
        foreach ($relationships as $relationship) {
            // Skip if relationship is not active
            if ($relationship->status !== 'active') {
                continue;
            }
            
            // Get original trades from the trader
            $traderTrades = Trade::where('user_id', $relationship->trader_user_id)
                ->whereNull('copied_from_trade_id')
                ->where('opened_at', '>=', $relationship->started_at)
                ->get();
            
            // Copy each trade
            foreach ($traderTrades as $originalTrade) {
                // Calculate lot size based on relationship settings
                $lotSize = $relationship->copy_fixed_size && $relationship->fixed_lot_size 
                    ? $relationship->fixed_lot_size 
                    : round($originalTrade->lot_size * ($relationship->risk_allocation_percentage / 100), 2);
                
                // Calculate profit based on the new lot size
                $pipValue = $this->calculatePipValue($originalTrade->symbol, $lotSize);
                $pips = abs($originalTrade->exit_price - $originalTrade->entry_price) * $this->getPipMultiplier($originalTrade->symbol);
                $profitDirection = ($originalTrade->type === 'BUY') ? 
                    ($originalTrade->exit_price > $originalTrade->entry_price ? 1 : -1) : 
                    ($originalTrade->exit_price < $originalTrade->entry_price ? 1 : -1);
                $profit = round($pips * $pipValue * $profitDirection, 2);
                
                // Create the copied trade
                Trade::create([
                    'user_id' => $relationship->copier_user_id,
                    'symbol' => $originalTrade->symbol,
                    'type' => $originalTrade->type,
                    'entry_price' => $originalTrade->entry_price,
                    'exit_price' => $originalTrade->exit_price,
                    'lot_size' => $lotSize,
                    'profit' => $profit,
                    'stop_loss' => $relationship->copy_stop_loss ? $originalTrade->stop_loss : null,
                    'take_profit' => $relationship->copy_take_profit ? $originalTrade->take_profit : null,
                    'opened_at' => $originalTrade->opened_at,
                    'closed_at' => $originalTrade->closed_at,
                    'copied_from_trade_id' => $originalTrade->id,
                    'copy_trading_relationship_id' => $relationship->id,
                ]);
            }
        }
        
        $this->command->info('Created ' . Trade::count() . ' trades successfully.');
    }
    
    /**
     * Get base price for a currency pair.
     *
     * @param string $symbol
     * @return float
     */
    private function getBasePrice(string $symbol): float
    {
        $basePrices = [
            'EUR/USD' => 1.12,
            'GBP/USD' => 1.31,
            'USD/JPY' => 134.50,
            'USD/CHF' => 0.89,
            'AUD/USD' => 0.67,
            'USD/CAD' => 1.35,
            'NZD/USD' => 0.62,
            'EUR/GBP' => 0.85,
            'EUR/JPY' => 150.80,
            'GBP/JPY' => 176.50,
        ];
        
        return $basePrices[$symbol] ?? 1.0;
    }
    
    /**
     * Calculate pip value for a given symbol and lot size.
     *
     * @param string $symbol
     * @param float $lotSize
     * @return float
     */
    private function calculatePipValue(string $symbol, float $lotSize): float
    {
        // Standard pip value for major pairs with 1.0 lot size is typically $10 per pip
        $standardPipValue = 10.0;
        
        // Adjust based on currency pair
        $pipMultiplier = $this->getPipMultiplier($symbol);
        
        return $standardPipValue * $lotSize;
    }
    
    /**
     * Get pip multiplier for a currency pair.
     *
     * @param string $symbol
     * @return float
     */
    private function getPipMultiplier(string $symbol): float
    {
        // For JPY pairs, a pip is 0.01, for others it's 0.0001
        return strpos($symbol, 'JPY') !== false ? 100 : 10000;
    }
}
