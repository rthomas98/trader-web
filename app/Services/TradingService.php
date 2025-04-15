<?php

namespace App\Services;

use App\Models\TradingOrder;
use App\Models\TradingPosition;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;

class TradingService
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
     * Process a market order.
     *
     * @param User $user
     * @param array $orderData
     * @return array
     */
    public function processMarketOrder(User $user, array $orderData): array
    {
        // Start a database transaction
        return DB::transaction(function () use ($user, $orderData) {
            // Get the current price for the currency pair
            $currentPrice = $this->marketDataService->getCurrentPrice($orderData['currency_pair']);
            
            // Calculate the required margin
            $requiredMargin = $this->calculateRequiredMargin(
                $orderData['quantity'],
                $currentPrice,
                $user->leverage
            );
            
            // Check if the user has sufficient margin
            if ($user->available_margin < $requiredMargin) {
                throw new \Exception('Insufficient margin available.');
            }
            
            // Create the order
            $order = new TradingOrder([
                'user_id' => $user->id,
                'currency_pair' => $orderData['currency_pair'],
                'order_type' => 'MARKET',
                'side' => $orderData['side'],
                'quantity' => $orderData['quantity'],
                'price' => $currentPrice,
                'stop_loss' => $orderData['stop_loss'] ?? null,
                'take_profit' => $orderData['take_profit'] ?? null,
                'time_in_force' => 'GTC',
                'status' => 'FILLED',
            ]);
            
            $order->save();
            
            // Create the position
            $position = new TradingPosition([
                'user_id' => $user->id,
                'currency_pair' => $orderData['currency_pair'],
                'trade_type' => $orderData['side'],
                'entry_price' => $currentPrice,
                'stop_loss' => $orderData['stop_loss'] ?? null,
                'take_profit' => $orderData['take_profit'] ?? null,
                'status' => 'OPEN',
                'entry_time' => now(),
                'quantity' => $orderData['quantity'],
            ]);
            
            $position->save();
            
            // Update user's available margin
            $user->available_margin -= $requiredMargin;
            $user->save();
            
            return [
                'success' => true,
                'order' => $order,
                'position' => $position,
                'message' => 'Market order executed successfully.',
            ];
        });
    }
    
    /**
     * Close a trading position.
     *
     * @param User $user
     * @param TradingPosition $position
     * @return array
     */
    public function closePosition(User $user, TradingPosition $position): array
    {
        // Start a database transaction
        return DB::transaction(function () use ($user, $position) {
            // Check if the position is already closed
            if ($position->status !== 'OPEN') {
                throw new \Exception('Position is already closed.');
            }
            
            // Get the current price for the currency pair
            $currentPrice = $this->marketDataService->getCurrentPrice($position->currency_pair);
            
            // Calculate profit/loss
            $profitLoss = $this->marketDataService->calculateProfitLoss(
                $position->trade_type,
                $position->entry_price,
                $currentPrice,
                $position->quantity
            );
            
            // Calculate the required margin that was locked
            $requiredMargin = $this->calculateRequiredMargin(
                $position->quantity,
                $position->entry_price,
                $user->leverage
            );
            
            // Update the position
            $position->exit_price = $currentPrice;
            $position->exit_time = now();
            $position->profit_loss = $profitLoss;
            $position->status = 'CLOSED';
            $position->save();
            
            // Update user's available margin and account balance
            $user->available_margin += $requiredMargin;
            $user->account_balance += $profitLoss;
            $user->save();
            
            // Update the user's wallet
            $wallet = Wallet::where('user_id', $user->id)
                ->where('is_default', true)
                ->first();
                
            if ($wallet) {
                $wallet->balance += $profitLoss;
                $wallet->available_balance += $profitLoss;
                $wallet->save();
            }
            
            return [
                'success' => true,
                'position' => $position,
                'profit_loss' => $profitLoss,
                'message' => 'Position closed successfully.',
            ];
        });
    }
    
    /**
     * Calculate the required margin for a position.
     *
     * @param float $quantity
     * @param float $price
     * @param int $leverage
     * @return float
     */
    public function calculateRequiredMargin(float $quantity, float $price, int $leverage): float
    {
        return ($quantity * $price) / $leverage;
    }
    
    /**
     * Check if stop loss or take profit has been triggered for a position.
     *
     * @param TradingPosition $position
     * @return bool
     */
    public function checkStopLossTakeProfit(TradingPosition $position): bool
    {
        if ($position->status !== 'OPEN') {
            return false;
        }
        
        $currentPrice = $this->marketDataService->getCurrentPrice($position->currency_pair);
        
        // Check stop loss
        if ($position->stop_loss && $position->trade_type === 'BUY' && $currentPrice <= $position->stop_loss) {
            return true;
        }
        
        if ($position->stop_loss && $position->trade_type === 'SELL' && $currentPrice >= $position->stop_loss) {
            return true;
        }
        
        // Check take profit
        if ($position->take_profit && $position->trade_type === 'BUY' && $currentPrice >= $position->take_profit) {
            return true;
        }
        
        if ($position->take_profit && $position->trade_type === 'SELL' && $currentPrice <= $position->take_profit) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get chart data for a currency pair.
     *
     * @param string $currencyPair
     * @param string $timeframe
     * @param int $limit
     * @param bool $includePredictions
     * @return array
     */
    public function getChartData(string $currencyPair, string $timeframe = '1d', int $limit = 30, bool $includePredictions = false): array
    {
        $days = 30;
        
        switch ($timeframe) {
            case '1h':
                $days = 2;
                break;
            case '4h':
                $days = 7;
                break;
            case '1d':
                $days = 30;
                break;
            case '1w':
                $days = 180;
                break;
            case '1m':
                $days = 365;
                break;
        }
        
        $data = $this->marketDataService->getHistoricalPriceData($currencyPair, $days, $timeframe);
        
        // If predictive mode is not enabled, just return the historical data
        if (!$includePredictions) {
            return $data['historical'];
        }
        
        // Otherwise return both historical and predictive data
        return [
            'historical' => $data['historical'],
            'predictive' => $data['predictive'] ?? []
        ];
    }
    
    /**
     * Get available currency pairs.
     *
     * @return array
     */
    public function getAvailableCurrencyPairs(): array
    {
        // In a real application, this would fetch data from a market data provider
        // For now, we'll return a static list
        return [
            'forex' => [
                'EUR/USD',
                'GBP/USD',
                'USD/JPY',
                'USD/CAD',
                'AUD/USD',
                'NZD/USD',
                'USD/CHF',
                'EUR/GBP',
                'EUR/JPY',
                'GBP/JPY',
            ],
            'crypto' => [
                'BTC/USD',
                'ETH/USD',
                'XRP/USD',
                'LTC/USD',
                'BCH/USD',
                'ADA/USD',
                'DOT/USD',
                'SOL/USD',
                'DOGE/USD',
                'LINK/USD',
            ],
            'commodities' => [
                'GOLD/USD',
                'SILVER/USD',
                'OIL/USD',
                'NATGAS/USD',
                'COPPER/USD',
            ],
            'indices' => [
                'US500/USD',
                'US30/USD',
                'USTEC/USD',
                'UK100/GBP',
                'DE40/EUR',
            ],
        ];
    }
}
