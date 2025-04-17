<?php

namespace App\Services;

use App\Models\PriceAlert;
use App\Models\Trade;
use App\Models\User;
use App\Notifications\PriceAlertNotification;
use App\Notifications\TradeExecutedNotification;
use App\Notifications\TradeClosedNotification;
use App\Notifications\PerformanceMilestoneNotification;
use App\Notifications\SocialInteractionNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send a price alert notification when a price target is hit.
     *
     * @param PriceAlert $priceAlert
     * @param float $currentPrice
     * @return void
     */
    public function sendPriceAlertNotification(PriceAlert $priceAlert, float $currentPrice): void
    {
        try {
            // Mark the alert as triggered
            $priceAlert->is_triggered = true;
            $priceAlert->triggered_at = Carbon::now();
            $priceAlert->save();
            
            // Send notification to the user
            $priceAlert->user->notify(new PriceAlertNotification($priceAlert, $currentPrice));
            
            Log::info('Price alert notification sent', [
                'user_id' => $priceAlert->user_id,
                'symbol' => $priceAlert->symbol,
                'condition' => $priceAlert->condition,
                'price' => $priceAlert->price,
                'current_price' => $currentPrice
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send price alert notification', [
                'error' => $e->getMessage(),
                'price_alert_id' => $priceAlert->id
            ]);
        }
    }
    
    /**
     * Send a notification when a trade is executed.
     *
     * @param Trade $trade
     * @param bool $isCopied
     * @return void
     */
    public function sendTradeExecutedNotification(Trade $trade, bool $isCopied = false): void
    {
        try {
            // Send notification to the user
            $trade->user->notify(new TradeExecutedNotification($trade, $isCopied));
            
            Log::info('Trade executed notification sent', [
                'user_id' => $trade->user_id,
                'trade_id' => $trade->id,
                'symbol' => $trade->symbol,
                'type' => $trade->type,
                'is_copied' => $isCopied
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send trade executed notification', [
                'error' => $e->getMessage(),
                'trade_id' => $trade->id
            ]);
        }
    }
    
    /**
     * Send a notification when a trade is closed.
     *
     * @param Trade $trade
     * @param bool $isCopied
     * @param string|null $closeReason
     * @return void
     */
    public function sendTradeClosedNotification(Trade $trade, bool $isCopied = false, ?string $closeReason = null): void
    {
        try {
            // Send notification to the user
            $trade->user->notify(new TradeClosedNotification($trade, $isCopied, $closeReason));
            
            Log::info('Trade closed notification sent', [
                'user_id' => $trade->user_id,
                'trade_id' => $trade->id,
                'symbol' => $trade->symbol,
                'type' => $trade->type,
                'profit' => $trade->profit,
                'is_copied' => $isCopied,
                'close_reason' => $closeReason
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send trade closed notification', [
                'error' => $e->getMessage(),
                'trade_id' => $trade->id
            ]);
        }
    }
    
    /**
     * Send a performance milestone notification.
     *
     * @param User $user
     * @param string $milestoneType
     * @param float $value
     * @param array $additionalData
     * @return void
     */
    public function sendPerformanceMilestoneNotification(
        User $user, 
        string $milestoneType, 
        float $value, 
        array $additionalData = []
    ): void {
        try {
            // Send notification to the user
            $user->notify(new PerformanceMilestoneNotification($milestoneType, $value, $additionalData));
            
            Log::info('Performance milestone notification sent', [
                'user_id' => $user->id,
                'milestone_type' => $milestoneType,
                'value' => $value,
                'additional_data' => $additionalData
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send performance milestone notification', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'milestone_type' => $milestoneType
            ]);
        }
    }
    
    /**
     * Send a social interaction notification.
     *
     * @param User $toUser
     * @param string $interactionType
     * @param User $fromUser
     * @param array|null $additionalData
     * @return void
     */
    public function sendSocialInteractionNotification(
        User $toUser, 
        string $interactionType, 
        User $fromUser, 
        ?array $additionalData = []
    ): void {
        try {
            // Send notification to the user
            $toUser->notify(new SocialInteractionNotification($interactionType, $fromUser, $additionalData));
            
            Log::info('Social interaction notification sent', [
                'to_user_id' => $toUser->id,
                'from_user_id' => $fromUser->id,
                'interaction_type' => $interactionType,
                'additional_data' => $additionalData
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send social interaction notification', [
                'error' => $e->getMessage(),
                'to_user_id' => $toUser->id,
                'from_user_id' => $fromUser->id,
                'interaction_type' => $interactionType
            ]);
        }
    }
    
    /**
     * Check price alerts for a specific symbol and trigger notifications if conditions are met.
     *
     * @param string $symbol
     * @param float $currentPrice
     * @return void
     */
    public function checkPriceAlerts(string $symbol, float $currentPrice): void
    {
        // Get active price alerts for this symbol
        $priceAlerts = PriceAlert::where('symbol', $symbol)
            ->where('is_triggered', false)
            ->get();
            
        foreach ($priceAlerts as $alert) {
            $shouldTrigger = false;
            
            // Check if alert conditions are met
            if ($alert->condition === 'above' && $currentPrice >= $alert->price) {
                $shouldTrigger = true;
            } elseif ($alert->condition === 'below' && $currentPrice <= $alert->price) {
                $shouldTrigger = true;
            } elseif ($alert->condition === 'percent_change') {
                $percentChange = abs(($currentPrice - $alert->price) / $alert->price * 100);
                if ($percentChange >= $alert->percent_change) {
                    $shouldTrigger = true;
                }
            }
            
            // Trigger notification if conditions are met
            if ($shouldTrigger) {
                $this->sendPriceAlertNotification($alert, $currentPrice);
                
                // If it's a recurring alert, create a new one with the current price as reference
                if ($alert->is_recurring) {
                    PriceAlert::create([
                        'user_id' => $alert->user_id,
                        'symbol' => $alert->symbol,
                        'condition' => $alert->condition,
                        'price' => $currentPrice,
                        'percent_change' => $alert->percent_change,
                        'is_recurring' => true,
                        'is_triggered' => false,
                    ]);
                }
            }
        }
    }
    
    /**
     * Check for performance milestones and trigger notifications if conditions are met.
     *
     * @param User $user
     * @return void
     */
    public function checkPerformanceMilestones(User $user): void
    {
        // Get user's trades
        $trades = $user->trades;
        
        if ($trades->isEmpty()) {
            return;
        }
        
        // Calculate total profit
        $totalProfit = $trades->sum('profit');
        
        // Calculate win rate
        $totalTrades = $trades->where('closed_at', '!=', null)->count();
        $winningTrades = $trades->where('closed_at', '!=', null)->where('profit', '>', 0)->count();
        $winRate = $totalTrades > 0 ? ($winningTrades / $totalTrades) * 100 : 0;
        
        // Check for profit milestones (e.g., $100, $500, $1000, $5000, $10000)
        $profitMilestones = [100, 500, 1000, 5000, 10000];
        foreach ($profitMilestones as $milestone) {
            if ($totalProfit >= $milestone && $totalProfit < ($milestone * 1.1)) {
                $this->sendPerformanceMilestoneNotification(
                    $user,
                    'profit_milestone',
                    $totalProfit,
                    [
                        'milestone' => $milestone,
                        'period' => 'all-time',
                        'details' => "You've reached a profit milestone of $" . number_format($milestone, 2)
                    ]
                );
                break;
            }
        }
        
        // Check for win rate milestones (e.g., 60%, 70%, 80%, 90%)
        $winRateMilestones = [60, 70, 80, 90];
        foreach ($winRateMilestones as $milestone) {
            if ($winRate >= $milestone && $winRate < ($milestone + 5) && $totalTrades >= 10) {
                $this->sendPerformanceMilestoneNotification(
                    $user,
                    'win_streak',
                    $winRate,
                    [
                        'milestone' => $milestone,
                        'total_trades' => $totalTrades,
                        'winning_trades' => $winningTrades,
                        'details' => "Your win rate has reached {$milestone}% with {$winningTrades} winning trades out of {$totalTrades} total trades"
                    ]
                );
                break;
            }
        }
        
        // Check for consecutive winning trades
        $recentTrades = $user->trades()
            ->where('closed_at', '!=', null)
            ->orderBy('closed_at', 'desc')
            ->limit(10)
            ->get();
            
        $consecutiveWins = 0;
        foreach ($recentTrades as $trade) {
            if ($trade->profit > 0) {
                $consecutiveWins++;
            } else {
                break;
            }
        }
        
        // Notify on 5 or 10 consecutive wins
        if ($consecutiveWins == 5 || $consecutiveWins == 10) {
            $this->sendPerformanceMilestoneNotification(
                $user,
                'win_streak',
                $consecutiveWins,
                [
                    'details' => "You've achieved {$consecutiveWins} consecutive winning trades!"
                ]
            );
        }
        
        // Check for drawdown alerts
        $peakEquity = $trades->where('closed_at', '!=', null)->max('profit');
        $currentEquity = $totalProfit;
        $drawdown = $peakEquity > 0 ? (($peakEquity - $currentEquity) / $peakEquity) * 100 : 0;
        
        // Alert on significant drawdowns (e.g., 10%, 20%, 30%)
        $drawdownThresholds = [10, 20, 30];
        foreach ($drawdownThresholds as $threshold) {
            if ($drawdown >= $threshold && $drawdown < ($threshold + 5)) {
                $this->sendPerformanceMilestoneNotification(
                    $user,
                    'drawdown_alert',
                    $drawdown,
                    [
                        'threshold' => $threshold,
                        'peak_equity' => $peakEquity,
                        'current_equity' => $currentEquity,
                        'details' => "Your account is experiencing a drawdown of " . number_format($drawdown, 2) . "% from its peak"
                    ]
                );
                break;
            }
        }
    }
}
