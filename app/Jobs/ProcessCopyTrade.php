<?php

namespace App\Jobs;

use App\Models\CopyTradingRelationship;
use App\Models\Trade;
use App\Models\User;
use App\Notifications\CopyTradeNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCopyTrade implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The original trade.
     *
     * @var Trade
     */
    protected $trade;

    /**
     * The trader who made the trade.
     *
     * @var User
     */
    protected $trader;

    /**
     * Create a new job instance.
     *
     * @param Trade $trade
     * @param User $trader
     */
    public function __construct(Trade $trade, User $trader)
    {
        $this->trade = $trade;
        $this->trader = $trader;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Processing copy trade for trade ID: {$this->trade->id} by trader: {$this->trader->name}");

        // Find all active copy trading relationships for this trader
        $relationships = CopyTradingRelationship::with('copier')
            ->where('trader_user_id', $this->trader->id)
            ->where('status', 'active')
            ->get();

        if ($relationships->isEmpty()) {
            Log::info("No active copy trading relationships found for trader: {$this->trader->name}");
            return;
        }

        Log::info("Found {$relationships->count()} active copy trading relationships for trader: {$this->trader->name}");

        // Process each relationship
        foreach ($relationships as $relationship) {
            $this->processCopyTradeForRelationship($relationship);
        }
    }

    /**
     * Process copy trade for a specific relationship.
     *
     * @param CopyTradingRelationship $relationship
     * @return void
     */
    protected function processCopyTradeForRelationship(CopyTradingRelationship $relationship): void
    {
        $copier = $relationship->copier;
        
        if (!$copier) {
            Log::warning("Copier not found for relationship ID: {$relationship->id}");
            return;
        }

        Log::info("Processing copy trade for copier: {$copier->name} (ID: {$copier->id})");

        try {
            // Calculate the lot size for the copier based on relationship settings
            $lotSize = $this->calculateLotSize($relationship);

            // Create a new trade for the copier
            $copyTrade = $this->createCopyTrade($relationship, $lotSize);

            // Check for max drawdown if set
            $this->checkMaxDrawdown($relationship, $copyTrade);

            // Prepare trade data for notification
            $tradeData = [
                'id' => $copyTrade->id,
                'symbol' => $copyTrade->symbol,
                'type' => $copyTrade->type,
                'entry_price' => $copyTrade->entry_price,
                'exit_price' => $copyTrade->exit_price,
                'lot_size' => $copyTrade->lot_size,
                'profit' => $copyTrade->profit,
                'opened_at' => $copyTrade->opened_at,
                'closed_at' => $copyTrade->closed_at,
            ];

            // Send notification to the copier
            $copier->notify(new CopyTradeNotification($relationship, $tradeData, 'trade_copied'));

            Log::info("Successfully copied trade ID: {$this->trade->id} for copier: {$copier->name} (ID: {$copier->id})");
        } catch (\Exception $e) {
            Log::error("Error copying trade: " . $e->getMessage(), [
                'trade_id' => $this->trade->id,
                'trader_id' => $this->trader->id,
                'copier_id' => $copier->id,
                'relationship_id' => $relationship->id,
                'exception' => $e,
            ]);
        }
    }

    /**
     * Calculate the lot size for the copied trade based on relationship settings.
     *
     * @param CopyTradingRelationship $relationship
     * @return float
     */
    protected function calculateLotSize(CopyTradingRelationship $relationship): float
    {
        if ($relationship->copy_fixed_size && $relationship->fixed_lot_size) {
            // Use fixed lot size
            return (float) $relationship->fixed_lot_size;
        } else {
            // Calculate proportional lot size based on risk allocation
            $riskPercentage = $relationship->risk_allocation_percentage / 100;
            return round($this->trade->lot_size * $riskPercentage, 2);
        }
    }

    /**
     * Create a copy of the trade for the copier.
     *
     * @param CopyTradingRelationship $relationship
     * @param float $lotSize
     * @return Trade
     */
    protected function createCopyTrade(CopyTradingRelationship $relationship, float $lotSize): Trade
    {
        // Copy the original trade properties
        $copyTrade = new Trade();
        $copyTrade->user_id = $relationship->copier_user_id;
        $copyTrade->symbol = $this->trade->symbol;
        $copyTrade->type = $this->trade->type;
        $copyTrade->entry_price = $this->trade->entry_price;
        $copyTrade->exit_price = $this->trade->exit_price;
        $copyTrade->lot_size = $lotSize;
        
        // Calculate profit based on the new lot size
        $pipsChange = abs($this->trade->exit_price - $this->trade->entry_price);
        $pipValue = $this->calculatePipValue($this->trade->symbol, $lotSize);
        $profitDirection = ($this->trade->type === 'BUY') ? 
            ($this->trade->exit_price > $this->trade->entry_price ? 1 : -1) : 
            ($this->trade->exit_price < $this->trade->entry_price ? 1 : -1);
        $copyTrade->profit = $pipsChange * $pipValue * $profitDirection;
        
        // Set stop loss and take profit if enabled in relationship
        if ($relationship->copy_stop_loss) {
            $copyTrade->stop_loss = $this->trade->stop_loss;
        }
        
        if ($relationship->copy_take_profit) {
            $copyTrade->take_profit = $this->trade->take_profit;
        }
        
        // Set timestamps
        $copyTrade->opened_at = $this->trade->opened_at;
        $copyTrade->closed_at = $this->trade->closed_at;
        
        // Set reference to original trade and relationship
        $copyTrade->copied_from_trade_id = $this->trade->id;
        $copyTrade->copy_trading_relationship_id = $relationship->id;
        
        $copyTrade->save();
        
        return $copyTrade;
    }

    /**
     * Calculate pip value for a given symbol and lot size.
     *
     * @param string $symbol
     * @param float $lotSize
     * @return float
     */
    protected function calculatePipValue(string $symbol, float $lotSize): float
    {
        // This is a simplified calculation - in a real system, you'd have more complex logic
        // Standard pip value for major pairs with 1.0 lot size is typically $10 per pip
        $standardPipValue = 10.0;
        
        // Adjust based on currency pair (simplified)
        $pipMultiplier = 1.0;
        if (strpos($symbol, 'JPY') !== false) {
            $pipMultiplier = 0.01; // JPY pairs have different pip values
        }
        
        return $standardPipValue * $lotSize * $pipMultiplier;
    }

    /**
     * Check if the trade exceeds max drawdown and pause the relationship if needed.
     *
     * @param CopyTradingRelationship $relationship
     * @param Trade $copyTrade
     * @return void
     */
    protected function checkMaxDrawdown(CopyTradingRelationship $relationship, Trade $copyTrade): void
    {
        // Skip if no max drawdown is set
        if (!$relationship->max_drawdown_percentage) {
            return;
        }
        
        // Calculate current drawdown
        // In a real system, you'd calculate this based on account equity history
        // This is a simplified version that just looks at recent losing trades
        $recentTrades = Trade::where('user_id', $relationship->copier_user_id)
            ->where('copy_trading_relationship_id', $relationship->id)
            ->where('profit', '<', 0)
            ->where('closed_at', '>=', now()->subDays(30))
            ->get();
            
        $totalLoss = $recentTrades->sum('profit');
        
        // Get the copier's account balance (simplified)
        $copier = User::find($relationship->copier_user_id);
        $accountBalance = $copier->account_balance ?? 10000; // Default to 10000 if not set
        
        // Calculate drawdown percentage
        $drawdownPercentage = abs($totalLoss) / $accountBalance * 100;
        
        // If drawdown exceeds the maximum, pause the relationship
        if ($drawdownPercentage >= $relationship->max_drawdown_percentage) {
            Log::warning("Max drawdown reached for relationship ID: {$relationship->id}. Pausing copy trading.");
            
            $relationship->update([
                'status' => 'paused',
            ]);
            
            // Send notification to the copier
            $copier->notify(new CopyTradeNotification($relationship, null, 'max_drawdown_reached'));
        }
    }
}
