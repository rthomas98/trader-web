<?php

namespace App\Http\Controllers;

use App\Models\EconomicCalendar;
use App\Models\MarketNews;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class MarketDataController extends Controller
{
    /**
     * Display the market data dashboard.
     */
    public function index()
    {
        $latestNews = MarketNews::orderBy('time_published', 'desc')
            ->take(5)
            ->get();
            
        $upcomingEvents = EconomicCalendar::where('event_date', '>=', now()->format('Y-m-d'))
            ->orderBy('event_date')
            ->orderBy('event_time')
            ->take(5)
            ->get();
            
        $marketOverview = $this->getMarketOverview();
        
        return Inertia::render('market-data/index', [
            'latestNews' => $latestNews,
            'upcomingEvents' => $upcomingEvents,
            'marketOverview' => $marketOverview,
        ]);
    }
    
    /**
     * Display market news.
     */
    public function news(Request $request)
    {
        $query = MarketNews::query();
        
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        
        if ($request->has('sentiment')) {
            $query->where('sentiment', $request->sentiment);
        }
        
        $news = $query->orderBy('time_published', 'desc')
            ->paginate(10);
            
        return Inertia::render('market-data/news', [
            'news' => $news,
            'filters' => $request->only(['category', 'sentiment']),
        ]);
    }
    
    /**
     * Display economic calendar.
     */
    public function calendar(Request $request)
    {
        $query = EconomicCalendar::query();
        
        if ($request->has('country')) {
            $query->where('country', $request->country);
        }
        
        if ($request->has('impact')) {
            $query->where('impact', $request->impact);
        }
        
        if ($request->has('date_from')) {
            $query->where('event_date', '>=', $request->date_from);
        } else {
            $query->where('event_date', '>=', now()->format('Y-m-d'));
        }
        
        if ($request->has('date_to')) {
            $query->where('event_date', '<=', $request->date_to);
        }
        
        $events = $query->orderBy('event_date')
            ->orderBy('event_time')
            ->paginate(20);
            
        return Inertia::render('market-data/calendar', [
            'events' => $events,
            'filters' => $request->only(['country', 'impact', 'date_from', 'date_to']),
        ]);
    }
    
    /**
     * Display market details for a specific symbol.
     */
    public function symbol(Request $request, string $symbol)
    {
        $symbolData = $this->getSymbolData($symbol);
        
        $relatedNews = MarketNews::whereJsonContains('topics', $symbol)
            ->orWhere('title', 'like', "%{$symbol}%")
            ->orderBy('time_published', 'desc')
            ->take(5)
            ->get();
            
        return Inertia::render('market-data/symbol', [
            'symbol' => $symbol,
            'symbolData' => $symbolData,
            'relatedNews' => $relatedNews,
        ]);
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
            'commodities' => [
                ['name' => 'Gold', 'symbol' => 'XAUUSD', 'price' => 2325.75, 'change' => 15.50, 'change_percent' => 0.67],
                ['name' => 'Oil (WTI)', 'symbol' => 'USOIL', 'price' => 82.25, 'change' => -0.75, 'change_percent' => -0.90],
                ['name' => 'Natural Gas', 'symbol' => 'NATGAS', 'price' => 2.15, 'change' => 0.05, 'change_percent' => 2.38],
            ],
        ];
    }
    
    /**
     * Get detailed data for a specific symbol.
     */
    private function getSymbolData(string $symbol)
    {
        // In a real application, this would fetch data from a market data provider
        // For now, we'll return dummy data based on the symbol
        $baseData = [
            'price' => 100.00,
            'change' => 0.50,
            'change_percent' => 0.50,
            'open' => 99.50,
            'high' => 101.25,
            'low' => 99.25,
            'volume' => 1250000,
            'market_cap' => 10000000000,
            'pe_ratio' => 15.5,
            'dividend_yield' => 2.5,
            'bid' => 99.95,
            'ask' => 100.05,
            'day_range' => '99.25 - 101.25',
            'year_range' => '75.50 - 125.75',
        ];
        
        // Customize based on symbol
        switch ($symbol) {
            case 'AAPL':
                return array_merge($baseData, [
                    'name' => 'Apple Inc.',
                    'price' => 175.25,
                    'change' => 2.75,
                    'change_percent' => 1.59,
                    'market_cap' => 2750000000000,
                ]);
            case 'MSFT':
                return array_merge($baseData, [
                    'name' => 'Microsoft Corporation',
                    'price' => 415.50,
                    'change' => 5.25,
                    'change_percent' => 1.28,
                    'market_cap' => 3100000000000,
                ]);
            case 'EURUSD':
                return array_merge($baseData, [
                    'name' => 'Euro / US Dollar',
                    'price' => 1.0825,
                    'change' => 0.0015,
                    'change_percent' => 0.14,
                    'market_cap' => null,
                    'pe_ratio' => null,
                    'dividend_yield' => null,
                ]);
            case 'BTCUSD':
                return array_merge($baseData, [
                    'name' => 'Bitcoin / US Dollar',
                    'price' => 65250.75,
                    'change' => 1250.50,
                    'change_percent' => 1.95,
                    'market_cap' => 1250000000000,
                    'pe_ratio' => null,
                    'dividend_yield' => null,
                ]);
            default:
                return array_merge($baseData, [
                    'name' => $symbol,
                ]);
        }
    }
}
