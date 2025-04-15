<?php

namespace App\Services;

class MarketDataService
{
    // ... (rest of the class remains the same)

    /**
     * Get market overview data including top gainers, losers, and most active pairs.
     *
     * @return array
     */
    public function getMarketOverview(): array
    {
        // Get all available currency pairs
        $forexPairs = [
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 
            'NZD/USD', 'USD/CHF', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY'
        ];
        
        $cryptoPairs = [
            'BTC/USD', 'ETH/USD', 'XRP/USD', 'LTC/USD', 'BCH/USD',
            'ADA/USD', 'DOT/USD', 'SOL/USD', 'DOGE/USD', 'LINK/USD'
        ];
        
        $commodityPairs = [
            'GOLD/USD', 'SILVER/USD', 'OIL/USD', 'NATGAS/USD', 'COPPER/USD'
        ];
        
        $indicesPairs = [
            'US500/USD', 'US30/USD', 'USTEC/USD', 'UK100/GBP', 'DE40/EUR'
        ];
        
        $allPairs = array_merge($forexPairs, $cryptoPairs, $commodityPairs, $indicesPairs);
        
        // Generate price changes for all pairs
        $pairsWithChanges = [];
        foreach ($allPairs as $pair) {
            $currentPrice = $this->getCurrentPrice($pair);
            $changePercent = (mt_rand(-300, 300) / 100); // -3% to +3%
            $changeAmount = $currentPrice * ($changePercent / 100);
            
            $pairsWithChanges[] = [
                'pair' => $pair,
                'price' => $currentPrice,
                'change_percent' => $changePercent,
                'change_amount' => $changeAmount,
                'volume' => mt_rand(10000, 1000000),
                'high' => $currentPrice * (1 + (mt_rand(10, 50) / 1000)),
                'low' => $currentPrice * (1 - (mt_rand(10, 50) / 1000)),
            ];
        }
        
        // Format data for frontend
        $forex = [];
        foreach ($forexPairs as $pair) {
            $pairData = collect($pairsWithChanges)->firstWhere('pair', $pair);
            if ($pairData) {
                $forex[] = [
                    'symbol' => $pair,
                    'price' => $pairData['price'],
                    'change_24h' => $pairData['change_percent'],
                    'volume_24h' => $pairData['volume']
                ];
            }
        }
        
        $crypto = [];
        foreach ($cryptoPairs as $pair) {
            $pairData = collect($pairsWithChanges)->firstWhere('pair', $pair);
            if ($pairData) {
                $crypto[] = [
                    'symbol' => $pair,
                    'price' => $pairData['price'],
                    'change_24h' => $pairData['change_percent'],
                    'volume_24h' => $pairData['volume']
                ];
            }
        }
        
        $indices = [];
        foreach ($indicesPairs as $pair) {
            $pairData = collect($pairsWithChanges)->firstWhere('pair', $pair);
            if ($pairData) {
                $indices[] = [
                    'symbol' => $pair,
                    'price' => $pairData['price'],
                    'change_24h' => $pairData['change_percent'],
                    'volume_24h' => $pairData['volume']
                ];
            }
        }
        
        // Sort for top gainers (highest positive change)
        $topGainers = collect($pairsWithChanges)
            ->filter(function ($item) {
                return $item['change_percent'] > 0;
            })
            ->sortByDesc('change_percent')
            ->take(5)
            ->values()
            ->toArray();
            
        // Sort for top losers (highest negative change)
        $topLosers = collect($pairsWithChanges)
            ->filter(function ($item) {
                return $item['change_percent'] < 0;
            })
            ->sortBy('change_percent')
            ->take(5)
            ->values()
            ->toArray();
            
        // Sort for most active (highest volume)
        $mostActive = collect($pairsWithChanges)
            ->sortByDesc('volume')
            ->take(5)
            ->values()
            ->toArray();
            
        // Get market sentiment
        $sentiment = [
            'bullish' => mt_rand(30, 70),
            'bearish' => mt_rand(30, 70),
            'neutral' => mt_rand(10, 30),
        ];
        
        // Normalize sentiment to sum to 100%
        $total = $sentiment['bullish'] + $sentiment['bearish'] + $sentiment['neutral'];
        $sentiment['bullish'] = round(($sentiment['bullish'] / $total) * 100);
        $sentiment['bearish'] = round(($sentiment['bearish'] / $total) * 100);
        $sentiment['neutral'] = 100 - $sentiment['bullish'] - $sentiment['bearish'];
        
        return [
            'forex' => $forex,
            'crypto' => $crypto,
            'indices' => $indices,
            'top_gainers' => $topGainers,
            'top_losers' => $topLosers,
            'most_active' => $mostActive,
            'market_sentiment' => $sentiment,
            'timestamp' => now()->timestamp,
        ];
    }
    
    /**
     * Get current price for a currency pair.
     *
     * @param string $currencyPair
     * @return float
     */
    public function getCurrentPrice(string $currencyPair): float
    {
        // In a real application, this would fetch data from a market data provider
        // For now, we'll return a random price within a realistic range
        $basePrices = [
            'EUR/USD' => 1.08,
            'GBP/USD' => 1.27,
            'USD/JPY' => 150.5,
            'USD/CAD' => 1.35,
            'AUD/USD' => 0.65,
            'NZD/USD' => 0.61,
            'USD/CHF' => 0.90,
            'EUR/GBP' => 0.85,
            'EUR/JPY' => 162.5,
            'GBP/JPY' => 191.5,
            'BTC/USD' => 65000,
            'ETH/USD' => 3500,
            'XRP/USD' => 0.50,
            'LTC/USD' => 80,
            'BCH/USD' => 350,
            'ADA/USD' => 0.40,
            'DOT/USD' => 7.5,
            'SOL/USD' => 150,
            'DOGE/USD' => 0.12,
            'LINK/USD' => 15,
            'GOLD/USD' => 2300,
            'SILVER/USD' => 28,
            'OIL/USD' => 75,
            'NATGAS/USD' => 2.1,
            'COPPER/USD' => 4.2,
            'US500/USD' => 5200,
            'US30/USD' => 39000,
            'USTEC/USD' => 18000,
            'UK100/GBP' => 7700,
            'DE40/EUR' => 17800,
        ];
        
        $basePrice = $basePrices[$currencyPair] ?? 1.0;
        $variation = $basePrice * 0.002; // 0.2% variation
        
        return $basePrice + (mt_rand(-100, 100) / 100) * $variation;
    }
    
    /**
     * Calculate profit/loss for a position.
     *
     * @param string $tradeType
     * @param float $entryPrice
     * @param float $currentPrice
     * @param float $quantity
     * @return float
     */
    public function calculateProfitLoss(string $tradeType, float $entryPrice, float $currentPrice, float $quantity): float
    {
        if ($tradeType === 'BUY') {
            return ($currentPrice - $entryPrice) * $quantity;
        } else {
            return ($entryPrice - $currentPrice) * $quantity;
        }
    }

    /**
     * Get historical price data for a currency pair.
     *
     * @param string $currencyPair
     * @param int $days
     * @param string $timeframe
     * @return array
     */
    public function getHistoricalPriceData(string $currencyPair, int $days, string $timeframe): array
    {
        // In a real application, this would fetch data from a market data provider
        // For now, we'll generate dummy data
        $data = [];
        $date = now();
        
        // Base price for the currency pair
        $basePrices = [
            'EUR/USD' => 1.08,
            'GBP/USD' => 1.27,
            'USD/JPY' => 150.5,
            'USD/CAD' => 1.35,
            'AUD/USD' => 0.65,
            'NZD/USD' => 0.61,
            'USD/CHF' => 0.90,
            'EUR/GBP' => 0.85,
            'EUR/JPY' => 162.5,
            'GBP/JPY' => 191.5,
            'BTC/USD' => 65000,
            'ETH/USD' => 3500,
            'XRP/USD' => 0.50,
            'LTC/USD' => 80,
            'BCH/USD' => 350,
            'ADA/USD' => 0.40,
            'DOT/USD' => 7.5,
            'SOL/USD' => 150,
            'DOGE/USD' => 0.12,
            'LINK/USD' => 15,
            'GOLD/USD' => 2300,
            'SILVER/USD' => 28,
            'OIL/USD' => 75,
            'NATGAS/USD' => 2.1,
            'COPPER/USD' => 4.2,
            'US500/USD' => 5200,
            'US30/USD' => 39000,
            'USTEC/USD' => 18000,
            'UK100/GBP' => 7700,
            'DE40/EUR' => 17800,
        ];
        
        $price = $basePrices[$currencyPair] ?? 1.0;
        $volatility = $price * 0.01; // 1% volatility
        
        // Determine interval based on timeframe
        $interval = 1; // Default to 1 day
        switch ($timeframe) {
            case '1m':
                $interval = 1 / (24 * 60); // 1 minute
                break;
            case '5m':
                $interval = 5 / (24 * 60); // 5 minutes
                break;
            case '15m':
                $interval = 15 / (24 * 60); // 15 minutes
                break;
            case '30m':
                $interval = 30 / (24 * 60); // 30 minutes
                break;
            case '1h':
                $interval = 1 / 24; // 1 hour
                break;
            case '4h':
                $interval = 4 / 24; // 4 hours
                break;
            case '1d':
                $interval = 1; // 1 day
                break;
            case '1w':
                $interval = 7; // 1 week
                break;
        }
        
        // Generate historical data
        $historicalData = [];
        $timestamp = now()->subDays($days)->timestamp * 1000; // Convert to milliseconds
        
        for ($i = 0; $i < $days / $interval; $i++) {
            // Random price movement
            $change = (mt_rand(-100, 100) / 100) * $volatility;
            $price += $change;
            
            // Generate OHLC data
            $open = $price;
            $high = $price * (1 + (mt_rand(0, 50) / 1000)); // Up to 0.5% higher
            $low = $price * (1 - (mt_rand(0, 50) / 1000)); // Up to 0.5% lower
            $close = $price + (mt_rand(-30, 30) / 100) * $volatility;
            
            // Ensure high is the highest and low is the lowest
            $high = max($high, $open, $close);
            $low = min($low, $open, $close);
            
            $historicalData[] = [
                'timestamp' => $timestamp,
                'open' => round($open, 5),
                'high' => round($high, 5),
                'low' => round($low, 5),
                'close' => round($close, 5),
                'volume' => mt_rand(1000, 10000)
            ];
            
            $timestamp += $interval * 24 * 60 * 60 * 1000; // Add interval in milliseconds
        }
        
        // Generate predictive data using the German Sniper EA algorithm
        // $predictiveData = $this->generatePredictiveData($historicalData, $currencyPair, $timeframe); // Temporarily disabled due to incomplete function
        
        // Return empty predictive data with the same structure as historical data
        $predictiveData = [
            'data' => [] // Empty array but with the expected structure
        ];
        
        return [
            'historical' => $historicalData,
            'predictive' => $predictiveData // Return structured empty predictive data
        ];
    }
    
    /**
     * Generate predictive data using German Sniper EA algorithm.
     *
     * @param array $historicalData
     * @param string $currencyPair
     * @param string $timeframe
     * @return array
     */
    public function generatePredictiveData(array $historicalData, string $currencyPair, string $timeframe): array
    {
        if (empty($historicalData)) {
            return [];
        }
        
        // Extract close prices for indicator calculations
        $closePrices = array_column($historicalData, 'close');
        $highPrices = array_column($historicalData, 'high');
        $lowPrices = array_column($historicalData, 'low');
        
        // Calculate key indicators from German Sniper EA
        $ema8 = $this->calculateEMA($closePrices, 8);
        $ema14 = $this->calculateEMA($closePrices, 14);
        $ema21 = $this->calculateEMA($closePrices, 21);
        
        $rsi = $this->calculateRSI($closePrices);
        $bollingerBands = $this->calculateBollingerBands($closePrices);
        $stochastic = $this->calculateStochastic($highPrices, $lowPrices, $closePrices);
        $macd = $this->calculateMACD($closePrices);
        $volatility = $this->calculateVolatility($closePrices);
        
        // Determine trend direction based on EMAs
        $trendDirection = 0;
        if ($ema8 > $ema14 && $ema14 > $ema21) {
            $trendDirection = 1; // Uptrend
        } elseif ($ema8 < $ema14 && $ema14 < $ema21) {
            $trendDirection = -1; // Downtrend
        }
        
        // Determine momentum based on RSI and Stochastic
        $momentum = 0;
        if ($rsi > 50 && $stochastic['k'] > $stochastic['d'] && $stochastic['k'] < 80) {
            $momentum += 1;
        } elseif ($rsi < 50 && $stochastic['k'] < $stochastic['d'] && $stochastic['k'] > 20) {
            $momentum -= 1;
        }
        
        // Determine volatility factor
        $volatilityFactor = min(max($volatility * 100, 0.5), 2.0);
        
        // Determine strength based on MACD
        $strengthFactor = abs($macd['macd'] - $macd['signal']) / $closePrices[count($closePrices) - 1] * 1000;
        $strengthFactor = min(max($strengthFactor, 0.1), 1.5);
        
        // Determine reversal potential based on Bollinger Bands
        $lastPrice = end($closePrices);
        $reversalFactor = 0;
        
        if ($lastPrice > $bollingerBands['upper']) {
            $reversalFactor = -1 * ($lastPrice - $bollingerBands['upper']) / ($bollingerBands['upper'] - $bollingerBands['middle']);
        } elseif ($lastPrice < $bollingerBands['lower']) {
            $reversalFactor = ($bollingerBands['lower'] - $lastPrice) / ($bollingerBands['middle'] - $bollingerBands['lower']);
        }
        
        $reversalFactor = min(max($reversalFactor, -1), 1);
        
        // Generate predictive data
        $predictiveData = [];
        $lastHistoricalPoint = end($historicalData);
        $lastTimestamp = $lastHistoricalPoint['timestamp'];
        $lastClose = $lastHistoricalPoint['close'];
        
        // Determine interval based on timeframe
        $interval = 1; // Default to 1 day
        switch ($timeframe) {
            case '1m':
                $interval = 1 / (24 * 60); // 1 minute
                break;
            case '5m':
                $interval = 5 / (24 * 60); // 5 minutes
                break;
            case '15m':
                $interval = 15 / (24 * 60); // 15 minutes
                break;
            case '30m':
                $interval = 30 / (24 * 60); // 30 minutes
                break;
            case '1h':
                $interval = 1 / 24; // 1 hour
                break;
            case '4h':
                $interval = 4 / 24; // 4 hours
                break;
            case '1d':
                $interval = 1; // 1 day
                break;
            case '1w':
                $interval = 7; // 1 week
                break;
        }
        
        // Number of future points to predict
        $futurePeriods = 10;
        $baseVolatility = $volatility * $lastClose;
        
        for ($i = 1; $i <= $futurePeriods; $i++) {
            // Calculate timestamp for future point
            $futureTimestamp = $lastTimestamp + ($i * $interval * 24 * 60 * 60 * 1000);
            
            // Calculate decay factor (prediction confidence decreases with time)
            $decayFactor = exp(-0.2 * $i / $futurePeriods);
            
            // Calculate predicted price change
            $trendComponent = $trendDirection * $strengthFactor * $lastClose * 0.01 * $decayFactor;
            $momentumComponent = $momentum * $lastClose * 0.005 * $decayFactor;
            $reversalComponent = $reversalFactor * $lastClose * 0.01 * $decayFactor;
            $randomComponent = (mt_rand(-100, 100) / 100) * $baseVolatility * $volatilityFactor * (1 - $decayFactor);
            
            $priceChange = $trendComponent + $momentumComponent + $reversalComponent + $randomComponent;
            
            // Apply German Sniper EA rules
            // Rule 1: If RSI is extreme, expect mean reversion
            if ($rsi > 70) {
                $priceChange -= $lastClose * 0.005 * $decayFactor;
            } elseif ($rsi < 30) {
                $priceChange += $lastClose * 0.005 * $decayFactor;
            }
            
            // Rule 2: If price is outside Bollinger Bands, expect mean reversion
            if ($lastClose > $bollingerBands['upper']) {
                $priceChange -= $lastClose * 0.003 * $decayFactor;
            } elseif ($lastClose < $bollingerBands['lower']) {
                $priceChange += $lastClose * 0.003 * $decayFactor;
            }
            
            // Rule 3: MACD crossover signals
            if ($macd['macd'] > $macd['signal'] && $macd['macd'] < 0) {
                $priceChange += $lastClose * 0.004 * $decayFactor;
            } elseif ($macd['macd'] < $macd['signal'] && $macd['macd'] > 0) {
                $priceChange -= $lastClose * 0.004 * $decayFactor;
            }
            
            // Calculate predicted price
            $predictedPrice = $lastClose + $priceChange;
            
            // Ensure predicted price is positive
            $predictedPrice = max($predictedPrice, $lastClose * 0.9);
            
            // Generate OHLC data for predicted point
            $open = $lastClose;
            $close = $predictedPrice;
            $high = max($open, $close) + (mt_rand(0, 50) / 1000) * $predictedPrice * $volatilityFactor;
            $low = min($open, $close) - (mt_rand(0, 50) / 1000) * $predictedPrice * $volatilityFactor;
            
            $predictiveData[] = [
                'timestamp' => $futureTimestamp,
                'open' => round($open, 5),
                'high' => round($high, 5),
                'low' => round($low, 5),
                'close' => round($close, 5),
                'volume' => mt_rand(1000, 10000),
                'predicted' => true
            ];
            
            // Update last close for next iteration
            $lastClose = $predictedPrice;
        }
        
        return $predictiveData;
    }

    /**
     * Calculate Exponential Moving Average (EMA)
     *
     * @param array $prices
     * @param int $period
     * @return float
     */
    private function calculateEMA(array $prices, int $period): float
    {
        if (count($prices) < $period) {
            return end($prices);
        }
        
        // Calculate initial SMA
        $sma = array_sum(array_slice($prices, -$period)) / $period;
        
        // Calculate multiplier
        $multiplier = 2 / ($period + 1);
        
        // Calculate EMA
        $ema = $sma;
        for ($i = count($prices) - $period + 1; $i < count($prices); $i++) {
            $ema = ($prices[$i] - $ema) * $multiplier + $ema;
        }
        
        return $ema;
    }

    /**
     * Calculate Relative Strength Index (RSI)
     * Used by German Sniper EA for trend confirmation
     *
     * @param array $prices
     * @param int $period
     * @return float
     */
    private function calculateRSI(array $prices, int $period = 14): float
    {
        if (count($prices) <= $period) {
            return 50; // Default to neutral
        }
        
        $gains = 0;
        $losses = 0;
        
        // Calculate initial average gain/loss
        for ($i = count($prices) - $period; $i < count($prices); $i++) {
            $change = $prices[$i] - $prices[$i - 1];
            if ($change >= 0) {
                $gains += $change;
            } else {
                $losses -= $change;
            }
        }
        
        $avgGain = $gains / $period;
        $avgLoss = $losses / $period;
        
        // Calculate RSI
        if ($avgLoss == 0) {
            return 100;
        }
        
        $rs = $avgGain / $avgLoss;
        return 100 - (100 / (1 + $rs));
    }

    /**
     * Calculate Bollinger Bands
     * Used by German Sniper EA for volatility and reversal signals
     *
     * @param array $prices
     * @param int $period
     * @param float $deviations
     * @return array
     */
    private function calculateBollingerBands(array $prices, int $period = 20, float $deviations = 2.0): array
    {
        if (count($prices) < $period) {
            $lastPrice = end($prices);
            return [
                'upper' => $lastPrice * 1.02,
                'middle' => $lastPrice,
                'lower' => $lastPrice * 0.98
            ];
        }
        
        // Calculate SMA (middle band)
        $slice = array_slice($prices, -$period);
        $sma = array_sum($slice) / $period;
        
        // Calculate standard deviation
        $variance = 0;
        foreach ($slice as $price) {
            $variance += pow($price - $sma, 2);
        }
        $stdDev = sqrt($variance / $period);
        
        // Calculate bands
        return [
            'upper' => $sma + ($deviations * $stdDev),
            'middle' => $sma,
            'lower' => $sma - ($deviations * $stdDev)
        ];
    }

    /**
     * Calculate Stochastic Oscillator
     * Used by German Sniper EA for overbought/oversold conditions
     *
     * @param array $highs
     * @param array $lows
     * @param array $closes
     * @param int $kPeriod
     * @param int $dPeriod
     * @return array
     */
    private function calculateStochastic(array $highs, array $lows, array $closes, int $kPeriod = 14, int $dPeriod = 3): array
    {
        if (count($closes) < $kPeriod) {
            return [
                'k' => 50,
                'd' => 50
            ];
        }
        
        // Get relevant slices
        $highSlice = array_slice($highs, -$kPeriod);
        $lowSlice = array_slice($lows, -$kPeriod);
        $closeSlice = array_slice($closes, -$kPeriod);
        
        // Find highest high and lowest low
        $highestHigh = max($highSlice);
        $lowestLow = min($lowSlice);
        
        // Calculate %K
        $k = 0;
        if ($highestHigh != $lowestLow) {
            $k = ((end($closes) - $lowestLow) / ($highestHigh - $lowestLow)) * 100;
        } else {
            $k = 50;
        }
        
        // Calculate %D (simple moving average of %K)
        // For simplicity, we'll use the current K value as D if we don't have enough data
        $d = $k;
        
        return [
            'k' => $k,
            'd' => $d
        ];
    }

    /**
     * Calculate MACD (Moving Average Convergence Divergence)
     * Used by German Sniper EA for trend strength and reversal signals
     *
     * @param array $prices
     * @param int $fastPeriod
     * @param int $slowPeriod
     * @param int $signalPeriod
     * @return array
     */
    private function calculateMACD(array $prices, int $fastPeriod = 12, int $slowPeriod = 26, int $signalPeriod = 9): array
    {
        if (count($prices) < $slowPeriod) {
            return [
                'macd' => 0,
                'signal' => 0,
                'histogram' => 0
            ];
        }
        
        // Calculate EMAs
        $fastEMA = $this->calculateEMA($prices, $fastPeriod);
        $slowEMA = $this->calculateEMA($prices, $slowPeriod);
        
        // Calculate MACD line
        $macd = $fastEMA - $slowEMA;
        
        // For simplicity, we'll use the MACD as the signal line if we don't have enough data
        $signal = $macd;
        $histogram = 0;
        
        return [
            'macd' => $macd,
            'signal' => $signal,
            'histogram' => $histogram
        ];
    }

    /**
     * Calculate volatility (standard deviation)
     * Used by German Sniper EA for risk assessment
     *
     * @param array $prices
     * @return float
     */
    private function calculateVolatility(array $prices): float
    {
        if (count($prices) <= 1) {
            return 0.001; // Default low volatility
        }
        
        $mean = array_sum($prices) / count($prices);
        $variance = 0;
        
        foreach ($prices as $price) {
            $variance += pow($price - $mean, 2);
        }
        
        return sqrt($variance / count($prices));
    }
}
