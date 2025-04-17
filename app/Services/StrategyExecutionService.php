<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class StrategyExecutionService
{
    /**
     * Execute the specified trading strategy on the historical data.
     *
     * @param array $historicalData Array of candle data (e.g., [['timestamp', 'open', 'high', 'low', 'close', 'volume'], ...])
     * @param string $strategyIdentifier Identifier for the strategy (e.g., 'ma_cross', 'rsi_divergence')
     * @param array $strategyParams Optional parameters specific to the strategy (e.g., ['fastPeriod' => 10, 'slowPeriod' => 30]).
     * @return array An array representing the results (e.g., list of trades, signals).
     */
    public function executeStrategy(array $historicalData, string $strategyIdentifier, array $strategyParams = []): array
    {
        Log::info("Executing strategy: {$strategyIdentifier}", ['data_points' => count($historicalData), 'params' => $strategyParams]);

        // Default parameters
        $fastPeriod = $strategyParams['fastPeriod'] ?? 10;
        $slowPeriod = $strategyParams['slowPeriod'] ?? 30;

        $trades = [];
        $closes = array_column($historicalData, 'close');

        switch ($strategyIdentifier) {
            case 'ma_cross':
                if (count($closes) < $slowPeriod) {
                    Log::warning('Not enough data points for the slowest MA period.', ['data_points' => count($closes), 'slow_period' => $slowPeriod]);
                    return [];
                }

                $fastSma = $this->calculateSMA($closes, $fastPeriod);
                $slowSma = $this->calculateSMA($closes, $slowPeriod);

                $position = 'none'; // 'none', 'long', 'short'
                $currentTrade = null;

                // Start iteration from where both SMAs are available
                for ($i = $slowPeriod; $i < count($historicalData); $i++) {
                    $currentFastSma = $fastSma[$i];
                    $previousFastSma = $fastSma[$i - 1];
                    $currentSlowSma = $slowSma[$i];
                    $previousSlowSma = $slowSma[$i - 1];

                    $timestamp = $historicalData[$i]['timestamp'];
                    $entryPrice = $historicalData[$i]['close']; // Enter on close of signal candle

                    // Golden Cross (Buy Signal)
                    if ($previousFastSma <= $previousSlowSma && $currentFastSma > $currentSlowSma) {
                        if ($position === 'short' || $position === 'none') { // Close short and/or Go long
                            if ($currentTrade) { // Close existing short trade
                                $currentTrade['exit_timestamp'] = $timestamp;
                                $currentTrade['exit_price'] = $entryPrice;
                                $currentTrade['reason'] = 'Exit Short (Golden Cross)';
                                $trades[] = $currentTrade;
                            }
                            $position = 'long';
                            $currentTrade = [
                                'type' => 'buy',
                                'entry_timestamp' => $timestamp,
                                'entry_price' => $entryPrice,
                                'exit_timestamp' => null,
                                'exit_price' => null,
                                'reason' => 'Entry Long (Golden Cross)'
                            ];
                        }
                    }
                    // Death Cross (Sell Signal)
                    elseif ($previousFastSma >= $previousSlowSma && $currentFastSma < $currentSlowSma) {
                        if ($position === 'long' || $position === 'none') { // Close long and/or Go short
                            if ($currentTrade) { // Close existing long trade
                                $currentTrade['exit_timestamp'] = $timestamp;
                                $currentTrade['exit_price'] = $entryPrice;
                                $currentTrade['reason'] = 'Exit Long (Death Cross)';
                                $trades[] = $currentTrade;
                            }
                            $position = 'short';
                            $currentTrade = [
                                'type' => 'sell',
                                'entry_timestamp' => $timestamp,
                                'entry_price' => $entryPrice,
                                'exit_timestamp' => null,
                                'exit_price' => null,
                                'reason' => 'Entry Short (Death Cross)'
                            ];
                        }
                    }
                }

                 // Close any open trade at the end of the data
                if ($currentTrade && $currentTrade['exit_timestamp'] === null) {
                    $lastDataPoint = end($historicalData);
                    $currentTrade['exit_timestamp'] = $lastDataPoint['timestamp'];
                    $currentTrade['exit_price'] = $lastDataPoint['close'];
                    $currentTrade['reason'] .= ' (End of Data)';
                    $trades[] = $currentTrade;
                }

                break;

            case 'rsi_divergence':
                Log::info("Applying RSI Divergence placeholder logic.");
                 if (count($historicalData) > 2) {
                    $trades[] = [
                        'type' => 'buy',
                        'entry_timestamp' => $historicalData[1]['timestamp'],
                        'entry_price' => $historicalData[1]['close'],
                        'exit_timestamp' => $historicalData[count($historicalData) - 1]['timestamp'],
                        'exit_price' => $historicalData[count($historicalData) - 1]['close'],
                        'reason' => 'Placeholder RSI Divergence Signal'
                    ];
                 }
                break;

            default:
                Log::warning("Strategy identifier '{$strategyIdentifier}' not recognized or implemented.");
                break;
        }

        Log::info("Strategy execution finished.", ['trade_count' => count($trades)]);
        return $trades;
    }

    /**
     * Calculates the Simple Moving Average (SMA) for a given period.
     *
     * @param array $data An array of numbers (e.g., closing prices).
     * @param int $period The number of periods for the SMA.
     * @return array An array containing the SMA values, aligned with the input data index.
     *               The first (period - 1) values will be null as SMA cannot be calculated.
     */
    protected function calculateSMA(array $data, int $period): array
    {
        $sma = array_fill(0, count($data), null);
        if ($period <= 0 || $period > count($data)) {
            return $sma; // Invalid period or not enough data
        }

        $sum = 0;
        // Calculate initial sum for the first SMA value
        for ($i = 0; $i < $period; $i++) {
            $sum += $data[$i];
        }
        $sma[$period - 1] = $sum / $period;

        // Calculate subsequent SMA values efficiently
        for ($i = $period; $i < count($data); $i++) {
            $sum -= $data[$i - $period]; // Subtract the oldest value
            $sum += $data[$i]; // Add the newest value
            $sma[$i] = $sum / $period;
        }

        return $sma;
    }

}
