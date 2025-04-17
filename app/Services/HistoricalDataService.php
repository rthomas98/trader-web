<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HistoricalDataService
{
    protected string $apiKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.alpha_vantage.key');
        $this->baseUrl = config('services.alpha_vantage.url');

        if (empty($this->apiKey)) {
            Log::error('Alpha Vantage API key is not configured.');
            // Optionally throw an exception or handle this case appropriately
        }
    }

    /**
     * Fetch historical market data for a given instrument and timeframe.
     *
     * @param string $instrument The trading instrument (e.g., 'EUR_USD')
     * @param string $timeframe The timeframe (e.g., 'H1', 'D1')
     * @param Carbon|null $startDate The start date for the data range
     * @param Carbon|null $endDate The end date for the data range
     * @return array An array of historical candle data (e.g., [['timestamp', 'open', 'high', 'low', 'close', 'volume'], ...])
     */
    public function getHistoricalData(string $instrument, string $timeframe, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        if (empty($this->apiKey)) {
            Log::warning('Attempted to fetch historical data without API key.');
            Log::info('Using sample data due to missing API key.');
            return $this->generateSampleData($instrument, $timeframe);
        }

        // Map instrument to Alpha Vantage format (e.g., EUR_USD -> from: EUR, to: USD)
        $symbols = explode('_', $instrument);
        if (count($symbols) !== 2) {
            Log::error("Invalid instrument format: {$instrument}");
            Log::info('Using sample data due to invalid instrument format.');
            return $this->generateSampleData($instrument, $timeframe);
        }
        $fromSymbol = strtoupper($symbols[0]);
        $toSymbol = strtoupper($symbols[1]);

        // Map timeframe to Alpha Vantage function and interval
        $params = [
            'apikey' => $this->apiKey,
            'from_symbol' => $fromSymbol,
            'to_symbol' => $toSymbol,
            'outputsize' => 'full', // Get as much data as possible
        ];

        $interval = null;
        switch (strtoupper($timeframe)) {
            case 'D1':
            case 'DAILY':
                $params['function'] = 'FX_DAILY';
                break;
            case 'H1':
            case '60MIN':
                $params['function'] = 'FX_INTRADAY';
                $interval = '60min';
                $params['interval'] = $interval;
                break;
            case 'M1':
            case '1MIN':
                $params['function'] = 'FX_INTRADAY';
                $interval = '1min';
                $params['interval'] = $interval;
                break;
            case 'M15':
            case '15MIN':
                $params['function'] = 'FX_INTRADAY';
                $interval = '15min';
                $params['interval'] = $interval;
                break;
            // Add mappings for other intervals (5min, 30min) if needed
            default:
                Log::error("Unsupported timeframe for Alpha Vantage: {$timeframe}");
                Log::info('Using sample data due to unsupported timeframe.');
                return $this->generateSampleData($instrument, $timeframe);
        }

        // Generate a cache key
        $cacheKey = "historical_data_{$instrument}_{$timeframe}";
        $cacheDuration = now()->addHours(1); // Cache for 1 hour

        try {
            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($params) {
                Log::info('Fetching fresh data from Alpha Vantage API.', $params);
                $response = Http::timeout(30)->get($this->baseUrl, $params);

                if ($response->failed()) {
                    Log::error('Alpha Vantage API request failed.', ['status' => $response->status(), 'url' => $this->baseUrl, 'params' => $params]);
                    $response->throw(); // Throw exception to prevent caching failure
                }

                $jsonData = $response->json();

                // Check for API specific errors or notes (e.g., rate limit)
                if (isset($jsonData['Note']) || isset($jsonData['Error Message'])) {
                    Log::error('Alpha Vantage API returned an error/note.', ['response' => $jsonData]);
                    // Throw an exception to indicate failure and prevent caching bad data
                    throw new \Exception('Alpha Vantage API error: ' . ($jsonData['Note'] ?? $jsonData['Error Message'] ?? 'Unknown error'));
                }

                return $jsonData; // Cache the successful JSON response
            });

            // Transform the data
            $candles = $this->transformAlphaVantageData($data, $params['function'], $interval);

            // Check if we have data and if it's within the requested date range
            if (empty($candles)) {
                Log::info('No data returned from API, using sample data instead.');
                return $this->generateSampleData($instrument, $timeframe);
            }

            // Filter by date range if provided
            if ($startDate || $endDate) {
                $candles = array_filter($candles, function ($candle) use ($startDate, $endDate) {
                    $timestamp = Carbon::parse($candle['timestamp']);
                    return (!$startDate || $timestamp->gte($startDate)) && (!$endDate || $timestamp->lte($endDate));
                });
            }

            return $candles;

        } catch (\Throwable $e) {
            Log::error('Failed to fetch or process Alpha Vantage data.', [
                'instrument' => $instrument,
                'timeframe' => $timeframe,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString() // Log trace for debugging
            ]);
            Cache::forget($cacheKey); // Forget cache on error
            Log::info('Using sample data due to API fetch failure.');
            return $this->generateSampleData($instrument, $timeframe); // Use sample data on failure
        }
    }

    /**
     * Generate sample historical data for testing when API fails
     *
     * @param string $instrument Instrument code (e.g., 'EUR_USD')
     * @param string $timeframe Timeframe code (e.g., 'M15', 'H1', 'D1')
     * @param int $dataPoints Number of data points to generate
     * @return array Array of sample candle data
     */
    protected function generateSampleData(string $instrument, string $timeframe, int $dataPoints = 100): array
    {
        Log::info('Generating sample data for testing.', ['instrument' => $instrument, 'timeframe' => $timeframe, 'points' => $dataPoints]);
        
        $sampleData = [];
        $basePrice = 1.10; // Starting price for EUR/USD
        if (strpos($instrument, 'GBP') !== false) {
            $basePrice = 1.25; // Different base for GBP pairs
        } elseif (strpos($instrument, 'JPY') !== false) {
            $basePrice = 110.0; // Different base for JPY pairs
        }
        
        // Determine candle interval in minutes
        $intervalMinutes = match (strtoupper($timeframe)) {
            'M1', '1MIN' => 1,
            'M5', '5MIN' => 5,
            'M15', '15MIN' => 15,
            'M30', '30MIN' => 30,
            'H1', '60MIN' => 60,
            'H4' => 240,
            'D1', 'DAILY' => 1440,
            default => 60 // Default to hourly
        };
        
        // Generate data points with some randomness and trend
        $currentPrice = $basePrice;
        $trend = 0.0001; // Small upward trend
        $volatility = 0.0005; // Price movement per candle
        
        $startTime = now()->subMinutes($intervalMinutes * $dataPoints);
        
        for ($i = 0; $i < $dataPoints; $i++) {
            $timestamp = $startTime->addMinutes($intervalMinutes)->toIso8601String();
            
            // Add some randomness to the price
            $change = (mt_rand(-100, 100) / 100) * $volatility;
            $currentPrice += $change + $trend;
            
            // Create OHLC data with some variation
            $open = $currentPrice;
            $high = $open + (mt_rand(5, 20) / 10000);
            $low = $open - (mt_rand(5, 20) / 10000);
            $close = $open + (mt_rand(-15, 15) / 10000);
            
            // Ensure high is highest and low is lowest
            $high = max($high, $open, $close);
            $low = min($low, $open, $close);
            
            $sampleData[] = [
                'timestamp' => $timestamp,
                'open' => round($open, 5),
                'high' => round($high, 5),
                'low' => round($low, 5),
                'close' => round($close, 5),
                'volume' => mt_rand(100, 1000) // Dummy volume
            ];
        }
        
        return $sampleData;
    }

    /**
     * Transforms the raw JSON response from Alpha Vantage into the standard candle format.
     *
     * @param array $jsonData The raw JSON data from the API.
     * @param string $function The Alpha Vantage function used (e.g., 'FX_DAILY', 'FX_INTRADAY').
     * @param string|null $interval The interval if intraday (e.g., '60min').
     * @return array Standardized candle data array.
     */
    protected function transformAlphaVantageData(array $jsonData, string $function, ?string $interval): array
    {
        $timeSeriesKey = match ($function) {
            'FX_DAILY' => 'Time Series FX (Daily)',
            'FX_INTRADAY' => "Time Series FX ({$interval})",
            default => null,
        };

        if (!$timeSeriesKey || !isset($jsonData[$timeSeriesKey])) {
            // More detailed logging for debugging API issues
            Log::warning('Could not find time series key in Alpha Vantage response.', [
                'key' => $timeSeriesKey, 
                'data_keys' => array_keys($jsonData),
                'response_sample' => json_encode(array_slice($jsonData, 0, 3, true)) // Log a sample of the response
            ]);
            
            // Check for common API errors
            if (isset($jsonData['Information'])) {
                Log::error('Alpha Vantage API limit reached: ' . $jsonData['Information']);
            } elseif (isset($jsonData['Error Message'])) {
                Log::error('Alpha Vantage API error: ' . $jsonData['Error Message']);
            }
            
            return [];
        }

        $timeSeries = $jsonData[$timeSeriesKey];
        $transformedData = [];

        foreach ($timeSeries as $timestamp => $ohlc) {
            // Alpha Vantage often includes timezone info, adjust if needed or ensure consistent UTC handling
            // The 'Z' indicates UTC, which Carbon should handle.
            // If timestamp format varies (e.g., just 'YYYY-MM-DD'), adjust parsing.
            try {
                $utcTimestamp = Carbon::parse($timestamp)->toIso8601String();
            } catch (\Exception $e) {
                Log::warning("Could not parse timestamp: {$timestamp}", ['error' => $e->getMessage()]);
                continue; // Skip this data point if timestamp is invalid
            }

            $transformedData[] = [
                'timestamp' => $utcTimestamp, // Standardize to ISO 8601 UTC
                'open' => (float) ($ohlc['1. open'] ?? 0),
                'high' => (float) ($ohlc['2. high'] ?? 0),
                'low' => (float) ($ohlc['3. low'] ?? 0),
                'close' => (float) ($ohlc['4. close'] ?? 0),
                'volume' => 0 // Alpha Vantage FX usually doesn't provide volume
            ];
        }

        // Alpha Vantage returns newest first, reverse to get chronological order (oldest first)
        return array_reverse($transformedData);
    }

    /**
     * Fetch historical data for a given instrument and timeframe
     *
     * @param string $instrument Instrument code (e.g., 'EUR_USD')
     * @param string $timeframe Timeframe code (e.g., 'M1', 'H1', 'D1')
     * @param bool $useSampleData Whether to use sample data if API fails
     * @return array Array of candle data
     */
    public function fetchHistoricalData(string $instrument, string $timeframe, bool $useSampleData = true): array
    {
        // Map the instrument to Alpha Vantage format
        $parts = explode('_', $instrument);
        
        // ... (rest of the method remains the same)

        try {
            // ... (rest of the try block remains the same)

            return $this->transformAlphaVantageData($data, $params['function'], $interval);

        } catch (\Throwable $e) {
            Log::error('Failed to fetch or process Alpha Vantage data, will try sample data.', [
                'instrument' => $instrument,
                'timeframe' => $timeframe,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString() // Log trace for debugging
            ]);
            Cache::forget($cacheKey); // Forget cache on error
            
            // If API fails, generate sample data for testing if enabled
            if ($useSampleData) {
                return $this->generateSampleData($instrument, $timeframe);
            } else {
                return []; // Return empty on failure if sample data not requested
            }
        }
    }
}
