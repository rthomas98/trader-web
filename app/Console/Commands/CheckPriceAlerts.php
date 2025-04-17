<?php

namespace App\Console\Commands;

use App\Models\PriceAlert;
use App\Services\NotificationService;
use App\Services\MarketDataService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckPriceAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-price-alerts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check price alerts and send notifications if conditions are met';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService, MarketDataService $marketDataService)
    {
        $this->info('Checking price alerts...');
        
        // Get all unique symbols from active price alerts
        $symbols = PriceAlert::where('is_triggered', false)
            ->distinct()
            ->pluck('symbol')
            ->toArray();
            
        if (empty($symbols)) {
            $this->info('No active price alerts found.');
            return;
        }
        
        $this->info('Found ' . count($symbols) . ' symbols with active price alerts.');
        
        // Check each symbol
        foreach ($symbols as $symbol) {
            try {
                // Get current price for the symbol
                $currentPrice = $marketDataService->getCurrentPrice($symbol);
                
                if ($currentPrice) {
                    $this->info("Checking alerts for {$symbol} at price {$currentPrice}");
                    
                    // Check price alerts for this symbol
                    $notificationService->checkPriceAlerts($symbol, $currentPrice);
                } else {
                    $this->warn("Could not get current price for {$symbol}");
                }
            } catch (\Exception $e) {
                $this->error("Error checking price alerts for {$symbol}: " . $e->getMessage());
                Log::error("Error checking price alerts for {$symbol}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
        
        $this->info('Price alert check completed.');
    }
}
