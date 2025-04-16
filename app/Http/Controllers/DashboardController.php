<?php

namespace App\Http\Controllers;

use App\Models\MarketNews;
use App\Models\EconomicCalendar;
use App\Models\PortfolioPosition;
use App\Models\TradingPosition;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the trading dashboard.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get user's wallets
        $wallets = $user->wallets()->get();
        $totalBalance = $wallets->sum('balance');
        
        // Get user's active trading positions
        $tradingPositions = $user->tradingPositions()
            ->where('status', 'OPEN')
            ->orderBy('entry_time', 'desc')
            ->take(5)
            ->get();
            
        // Calculate P&L for trading positions
        foreach ($tradingPositions as $position) {
            $currentPrice = $this->getCurrentPrice($position->currency_pair);
            $position->current_price = $currentPrice;
            $position->profit_loss = $this->calculateProfitLoss(
                $position->trade_type,
                $position->entry_price,
                $currentPrice,
                $position->quantity
            );
            $position->profit_loss_percentage = $position->entry_price > 0 
                ? (($currentPrice - $position->entry_price) / $position->entry_price) * 100 * ($position->trade_type === 'BUY' ? 1 : -1)
                : 0;
        }
        
        // Get user's portfolio positions
        $portfolioPositions = $user->portfolioPositions()
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
            
        // Calculate current value for portfolio positions
        foreach ($portfolioPositions as $position) {
            $currentPrice = $this->getCurrentPrice($position->symbol);
            $position->current_price = $currentPrice;
            $position->current_value = $position->quantity * $currentPrice;
            $position->profit_loss = $position->current_value - ($position->average_price * $position->quantity);
            $position->profit_loss_percentage = $position->average_price > 0 
                ? (($currentPrice - $position->average_price) / $position->average_price) * 100 
                : 0;
        }
        
        // Get latest market news
        $latestNews = MarketNews::orderBy('time_published', 'desc')
            ->take(5)
            ->get();
            
        // Get upcoming economic events
        $upcomingEvents = EconomicCalendar::where('event_date', '>=', now()->format('Y-m-d'))
            ->orderBy('event_date')
            ->orderBy('event_time')
            ->take(5)
            ->get();
            
        // Get market overview
        $marketOverview = $this->getMarketOverview();

        // Fetch Plaid account data (placeholder)
        $plaidAccounts = []; // TODO: Replace with actual Plaid data fetching logic

        return Inertia::render('dashboard', [
            'wallets' => $wallets,
            'totalBalance' => $totalBalance,
            'tradingPositions' => $tradingPositions,
            'portfolioPositions' => $portfolioPositions,
            'latestNews' => $latestNews,
            'upcomingEvents' => $upcomingEvents,
            'marketOverview' => $marketOverview,
            'accountSummary' => [
                'total_balance' => $totalBalance,
                'trading_pl' => $tradingPositions->sum('profit_loss'),
                'portfolio_value' => $portfolioPositions->sum('current_value'),
                'available_margin' => $user->available_margin ?? 0,
            ],
            'plaidAccounts' => $plaidAccounts, // Pass Plaid data to the view
        ]);
    }
    
    /**
     * Get current price for a symbol or currency pair.
     */
    private function getCurrentPrice(string $symbol)
    {
        // In a real application, this would fetch the current price from a market data provider
        // For now, we'll return a dummy price
        $prices = [
            // Stocks
            'AAPL' => 175.25,
            'MSFT' => 415.50,
            'GOOGL' => 175.75,
            'AMZN' => 185.25,
            'TSLA' => 175.50,
            'META' => 485.75,
            'NVDA' => 950.25,
            
            // Crypto
            'BTC' => 65250.75,
            'ETH' => 3475.25,
            'XRP' => 0.5525,
            
            // Forex
            'EUR/USD' => 1.0825,
            'GBP/USD' => 1.2550,
            'USD/JPY' => 150.25,
            'BTC/USD' => 65250.75,
            'ETH/USD' => 3475.25,
            'XRP/USD' => 0.5525,
        ];

        return $prices[$symbol] ?? mt_rand(10, 1000);
    }
    
    /**
     * Calculate profit/loss for a position.
     */
    private function calculateProfitLoss(string $tradeType, float $entryPrice, float $exitPrice, float $quantity)
    {
        if ($tradeType === 'BUY') {
            return ($exitPrice - $entryPrice) * $quantity;
        } else {
            return ($entryPrice - $exitPrice) * $quantity;
        }
    }
    
    /**
     * Get market overview data.
     */
    private function getMarketOverview()
    {
        // In a real application, this would fetch data from a market data provider
        // For now, we'll return dummy data
        return [
            'indices' => [
                ['name' => 'S&P 500', 'symbol' => 'SPX', 'price' => 5123.25, 'change' => 0.75, 'change_percent' => 0.15],
                ['name' => 'Dow Jones', 'symbol' => 'DJI', 'price' => 38765.50, 'change' => -125.30, 'change_percent' => -0.32],
                ['name' => 'Nasdaq', 'symbol' => 'IXIC', 'price' => 16142.75, 'change' => 85.20, 'change_percent' => 0.53],
            ],
            'forex' => [
                ['name' => 'EUR/USD', 'price' => 1.0825, 'change' => 0.0015, 'change_percent' => 0.14],
                ['name' => 'GBP/USD', 'price' => 1.2550, 'change' => -0.0025, 'change_percent' => -0.20],
                ['name' => 'USD/JPY', 'price' => 150.25, 'change' => 0.45, 'change_percent' => 0.30],
            ],
            'crypto' => [
                ['name' => 'Bitcoin', 'symbol' => 'BTC/USD', 'price' => 65250.75, 'change' => 1250.50, 'change_percent' => 1.95],
                ['name' => 'Ethereum', 'symbol' => 'ETH/USD', 'price' => 3475.25, 'change' => 85.50, 'change_percent' => 2.52],
                ['name' => 'Ripple', 'symbol' => 'XRP/USD', 'price' => 0.5525, 'change' => -0.0125, 'change_percent' => -2.21],
            ],
        ];
    }
}
