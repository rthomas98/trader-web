import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Zap } from 'lucide-react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface TradingChartProps {
  pairId: string;
  timeframe: string;
  predictiveEnabled?: boolean;
  historicalDataFn?: (pairId: string, timeframe: string, count?: number) => CandleData[];
}

interface CandleData {
  x: Date;
  y: number[];  // [open, high, low, close]
  pair?: string; // Add pair property for forex data
}

interface VolumeData {
  x: Date;
  y: number;
}

interface PredictionData {
  timestamp: Date;
  predictedPrice: number;
  confidence: number;
  direction: 'up' | 'down' | 'neutral';
}

const TradingChart: React.FC<TradingChartProps> = ({ 
  pairId, 
  timeframe, 
  predictiveEnabled = false,
  historicalDataFn
}) => {
  const [isClient, setIsClient] = useState(false);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, _setErrorMessage] = useState<string | null>(null);
  const [indicators, setIndicators] = useState({
    sma: true,
    ema: true,
    bollinger: true,
    rsi: false,
    macd: false,
    fibonacci: false,
  });

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper function to calculate Simple Moving Average
  const calculateSMA = useCallback((data: number[], period: number): number => {
    if (data.length < period) return 0;
    const sum = data.slice(-period).reduce((total, value) => total + value, 0);
    return sum / period;
  }, []);

  // Helper function to calculate RSI
  const calculateRSI = useCallback((data: number[], period: number): number => {
    if (data.length <= period) return 50; // Default to neutral if not enough data

    let gains = 0;
    let losses = 0;

    for (let i = data.length - period; i < data.length; i++) {
      const difference = data[i] - data[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    if (losses === 0) return 100;

    const relativeStrength = gains / losses;
    return 100 - (100 / (1 + relativeStrength));
  }, []);

  // Helper function to calculate Exponential Moving Average
  const calculateEMA = useCallback((data: number[], period: number): number => {
    if (data.length < period) return data[data.length - 1];

    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((total, price) => total + price, 0) / period;

    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * k + ema;
    }

    return ema;
  }, []);

  // Helper function to calculate MACD
  const calculateMACD = useCallback((data: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) => {
    // Calculate EMA values for the entire data series
    const fastEMA = data.map((_, i) =>
      calculateEMA(data.slice(0, i + 1), fastPeriod)
    );

    const slowEMA = data.map((_, i) =>
      calculateEMA(data.slice(0, i + 1), slowPeriod)
    );

    // Calculate MACD line (difference between fast and slow EMAs)
    const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);

    // Calculate signal line (EMA of MACD line)
    const signalLine = macdLine.map((_, i) =>
      calculateEMA(macdLine.slice(0, i + 1), signalPeriod)
    );

    return { macdLine, signalLine };
  }, [calculateEMA]);

  // Helper function to convert timeframe to milliseconds
  const getTimeframeInMs = useCallback((tf: string): number => {
    switch (tf) {
      case '5m': return 5 * 60 * 1000;
      case '15m': return 15 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '4h': return 4 * 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }, []);

  // Helper function to calculate ATR (Average True Range)
  const calculateATR = useCallback((data: CandleData[], period: number): number => {
    if (data.length < period) return 0;

    let atr = 0;
    for (let i = 1; i < data.length; i++) {
      const trueRange = Math.max(
        data[i].y[1] - data[i].y[2],
        Math.abs(data[i].y[1] - data[i - 1].y[3]),
        Math.abs(data[i].y[2] - data[i - 1].y[3])
      );
      atr += trueRange;
    }
    atr = atr / (data.length - 1);

    return atr;
  }, []);

  // Function to generate forex-specific predictions
  const generatePredictions = useCallback((data: CandleData[], timeframe: string): PredictionData | null => {
    if (!data || data.length < 30) {
      return null;
    }

    // Get the last candle data
    const lastCandle = data[data.length - 1];
    const lastClose = lastCandle.y[3];

    // Calculate SMA for different periods
    const sma20 = calculateSMA(data.map(candle => candle.y[3]), 20);
    const sma50 = calculateSMA(data.map(candle => candle.y[3]), 50);
    const sma100 = calculateSMA(data.map(candle => candle.y[3]), 100);

    // Calculate RSI
    const rsi = calculateRSI(data.map(candle => candle.y[3]), 14);

    // Calculate MACD
    const macd = calculateMACD(data.map(candle => candle.y[3]), 12, 26, 9);

    // Calculate ATR (Average True Range) for volatility
    const atr = calculateATR(data, 14);

    // Analyze medium-term trend based on SMA crossovers
    let mediumTermTrend = 'neutral';
    if (sma20 > sma50 && sma50 > sma100) {
      mediumTermTrend = 'bullish';
    } else if (sma20 < sma50 && sma50 < sma100) {
      mediumTermTrend = 'bearish';
    }

    // Analyze short-term momentum based on MACD
    let shortTermMomentum = 'neutral';
    if (macd.macdLine[macd.macdLine.length - 1] > macd.signalLine[macd.signalLine.length - 1] && macd.macdLine[macd.macdLine.length - 1] > macd.macdLine[macd.macdLine.length - 2]) {
      shortTermMomentum = 'bullish';
    } else if (macd.macdLine[macd.macdLine.length - 1] < macd.signalLine[macd.signalLine.length - 1] && macd.macdLine[macd.macdLine.length - 1] < macd.macdLine[macd.macdLine.length - 2]) {
      shortTermMomentum = 'bearish';
    }

    // Analyze overbought/oversold conditions based on RSI
    let overboughtOversold = 'neutral';
    if (rsi > 70) {
      overboughtOversold = 'overbought';
    } else if (rsi < 30) {
      overboughtOversold = 'oversold';
    }

    // Combine all signals to determine prediction
    let bullishSignals = 0;
    let bearishSignals = 0;

    // Add weight to each signal based on its importance for forex
    if (mediumTermTrend === 'bullish') bullishSignals += 2;
    if (mediumTermTrend === 'bearish') bearishSignals += 2;

    if (shortTermMomentum === 'bullish') bullishSignals += 1.5;
    if (shortTermMomentum === 'bearish') bearishSignals += 1.5;

    if (overboughtOversold === 'oversold') bullishSignals += 1;
    if (overboughtOversold === 'overbought') bearishSignals += 1;

    // Calculate total signals and determine direction
    const totalSignals = bullishSignals + bearishSignals;
    const netSignal = bullishSignals - bearishSignals;

    // Calculate predicted price based on ATR and net signal
    // For forex, we use smaller price movements as pips are smaller
    const pipMultiplier = getForexPipMultiplier(lastCandle.pair || '');
    const predictedMove = (atr * (netSignal / totalSignals) * pipMultiplier);
    const predictedPrice = lastClose + predictedMove;

    // Calculate confidence based on signal strength and consistency
    const confidence = Math.min(Math.abs(netSignal / totalSignals) * 100, 95);

    // Create prediction object
    const prediction: PredictionData = {
      timestamp: new Date(data[data.length - 1].x.getTime() + getTimeframeInMs(timeframe)),
      predictedPrice,
      confidence,
      direction: predictedPrice > lastClose ? 'up' : predictedPrice < lastClose ? 'down' : 'neutral'
    };

    return prediction;
  }, [getTimeframeInMs, calculateSMA, calculateRSI, calculateMACD, calculateATR]);

  // Helper function to get pip multiplier based on forex pair
  const getForexPipMultiplier = (pair: string): number => {
    if (!pair) return 0.0001; // Default for most pairs

    // JPY pairs have different pip values
    if (pair && pair.includes('JPY')) {
      return 0.01;
    }

    return 0.0001; // Standard for most forex pairs
  };

  // Toggle indicator visibility
  const toggleIndicator = useCallback((indicator: keyof typeof indicators) => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  }, []);

  // Fetch candle data when pairId or timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call to fetch candle data
        // For now, we'll generate mock data
        let data: CandleData[] = [];
        const volumes = data.map((item: any) => [item.timestamp, item.volume]);

        if (historicalDataFn) {
          data = historicalDataFn(pairId, timeframe);
        } else {
          // Fallback to generating data internally if no function provided
          const now = new Date();
          let basePrice = 100;
          let trend = Math.random() > 0.5 ? 1 : -1;
          let volatility = 2;

          for (let i = 100; i >= 0; i--) {
            const date = new Date(now.getTime() - i * getTimeframeInMs(timeframe));

            // Randomly change trend and volatility
            if (Math.random() < 0.05) trend = -trend;
            if (Math.random() < 0.1) volatility = Math.max(50, volatility + (Math.random() * 100 - 50));

            // Calculate price movement
            const change = trend * (Math.random() * volatility);
            basePrice += change;

            // Generate candle
            const open = basePrice;
            const close = open + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random() * volatility * 0.5;
            const low = Math.min(open, close) - Math.random() * volatility * 0.5;

            data.push({
              x: date,
              y: [open, high, low, close],
              pair: pairId
            });

            // Generate volume (higher on bigger price movements)
            volumes.push({
              x: date,
              y: Math.abs(change) * (0.5 + Math.random())
            });

            // Set up for next candle
            basePrice = close;
          }
        }

        setCandleData(data);
        setVolumeData(volumes);

        if (predictiveEnabled) {
          const prediction = generatePredictions(data, timeframe);
          if (prediction) {
            setPredictions([prediction]);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching candle data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [pairId, timeframe, predictiveEnabled, generatePredictions, historicalDataFn, getTimeframeInMs]);

  // Prepare annotations for predictions
  const predictionAnnotations = predictiveEnabled && predictions.length > 0 ? [
    {
      x: predictions[0].timestamp.getTime(),
      y: predictions[0].predictedPrice,
      marker: {
        size: 6,
        fillColor: predictions[0].direction === 'up' ? '#22c55e' :
                  predictions[0].direction === 'down' ? '#ef4444' : '#f59e0b',
        strokeColor: '#fff',
        radius: 2
      },
      label: {
        borderColor: predictions[0].direction === 'up' ? '#22c55e' :
                    predictions[0].direction === 'down' ? '#ef4444' : '#f59e0b',
        style: {
          color: '#fff',
          background: predictions[0].direction === 'up' ? '#22c55e' :
                      predictions[0].direction === 'down' ? '#ef4444' : '#f59e0b',
        },
        text: `Predicted: ${predictions[0].predictedPrice.toFixed(2)}`
      }
    }
  ] : [];

  // Prepare indicator series
  const indicatorSeries = [];

  if (indicators.sma && candleData.length > 0) {
    const closes = candleData.map(candle => candle.y[3]);
    const sma20Data = [];
    const sma50Data = [];

    for (let i = 0; i < candleData.length; i++) {
      if (i >= 19) { // Need at least 20 data points for SMA20
        const sma20 = calculateSMA(closes.slice(0, i + 1), 20);
        sma20Data.push({
          x: candleData[i].x,
          y: sma20
        });
      }

      if (i >= 49) { // Need at least 50 data points for SMA50
        const sma50 = calculateSMA(closes.slice(0, i + 1), 50);
        sma50Data.push({
          x: candleData[i].x,
          y: sma50
        });
      }
    }

    indicatorSeries.push({
      name: 'SMA20',
      type: 'line',
      data: sma20Data,
      color: '#8D5EB7'
    });

    indicatorSeries.push({
      name: 'SMA50',
      type: 'line',
      data: sma50Data,
      color: '#EECEE6'
    });
  }

  // ApexCharts options
  const options: ApexOptions = {
    chart: {
      type: 'candlestick',
      height: 500,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: true
      },
      background: 'transparent',
      foreColor: '#9ca3af', // Text color for light/dark mode compatibility
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#22c55e',
          downward: '#ef4444'
        },
        wick: {
          useFillColor: true
        }
      }
    },
    annotations: {
      points: predictionAnnotations
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        style: {
          colors: '#9ca3af' // Text color for light/dark mode compatibility
        }
      },
      axisBorder: {
        color: '#374151'
      },
      axisTicks: {
        color: '#374151'
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        formatter: (value) => value.toFixed(2),
        style: {
          colors: '#9ca3af' // Text color for light/dark mode compatibility
        }
      },
      axisBorder: {
        color: '#374151'
      }
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      x: {
        format: 'MMM dd HH:mm'
      },
      y: {
        formatter: (value) => typeof value === 'number' ? value.toFixed(2) : value
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true
        }
      },
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    responsive: [
      {
        breakpoint: 1000,
        options: {
          chart: {
            height: 400
          }
        }
      },
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 300
          }
        }
      }
    ],
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#9ca3af' // Text color for light/dark mode compatibility
      }
    }
  } as ApexOptions;

  // Volume chart options
  const volumeOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 120,
      brush: {
        enabled: true,
        target: 'candles'
      },
      selection: {
        enabled: true,
        xaxis: {
          min: candleData.length > 0 ? candleData[0].x.getTime() : undefined,
          max: candleData.length > 0 ? candleData[candleData.length - 1].x.getTime() : undefined
        }
      },
      background: 'transparent',
      foreColor: '#9ca3af', // Text color for light/dark mode compatibility
    },
    plotOptions: {
      bar: {
        columnWidth: '80%',
        colors: {
          ranges: [{
            from: -1000,
            to: 0,
            color: '#ef4444'
          }, {
            from: 1,
            to: 1000,
            color: '#22c55e'
          }]
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      type: 'datetime',
      labels: {
        show: false
      }
    },
    yaxis: {
      labels: {
        show: false
      }
    },
    grid: {
      show: false
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      x: {
        format: 'MMM dd HH:mm'
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[500px] w-full rounded-lg" />
        <Skeleton className="h-[120px] w-full rounded-lg" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-center">
          <p className="text-red-500 mb-2">{errorMessage}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          className={`cursor-pointer ${indicators.sma ? 'bg-[#8D5EB7]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          onClick={() => toggleIndicator('sma')}
        >
          SMA
        </Badge>
        <Badge
          className={`cursor-pointer ${indicators.ema ? 'bg-[#EECEE6] text-[#1A161D]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          onClick={() => toggleIndicator('ema')}
        >
          EMA
        </Badge>
        <Badge
          className={`cursor-pointer ${indicators.bollinger ? 'bg-[#D04014]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          onClick={() => toggleIndicator('bollinger')}
        >
          Bollinger
        </Badge>
        <Badge
          className={`cursor-pointer ${indicators.rsi ? 'bg-[#211DE49]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          onClick={() => toggleIndicator('rsi')}
        >
          RSI
        </Badge>
        <Badge
          className={`cursor-pointer ${indicators.macd ? 'bg-[#F9F9F9] text-[#1A161D]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          onClick={() => toggleIndicator('macd')}
        >
          MACD
        </Badge>
        <Badge
          className={`cursor-pointer ${indicators.fibonacci ? 'bg-[#8D5EB7]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          onClick={() => toggleIndicator('fibonacci')}
        >
          Fibonacci
        </Badge>
      </div>

      {predictiveEnabled && predictions.length > 0 && (
        <div className="mb-4 p-3 border border-[#8D5EB7] rounded-lg bg-[#EECEE6]/10 flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-[#8D5EB7] mr-2" />
            <div>
              <p className="text-sm font-medium">
                Prediction: {predictions[0].direction === 'up' ? 'Bullish' : predictions[0].direction === 'down' ? 'Bearish' : 'Neutral'}
              </p>
              <p className="text-xs text-muted-foreground">
                Next target: {predictions[0].predictedPrice.toFixed(2)} ({(predictions[0].confidence * 100).toFixed(0)}% confidence)
              </p>
            </div>
          </div>
          <Badge className={predictions[0].direction === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            predictions[0].direction === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}>
            {predictions[0].direction === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> :
              predictions[0].direction === 'down' ? <ArrowDown className="h-3 w-3 mr-1" /> :
                '→'}
            {candleData.length > 0 ? ((predictions[0].predictedPrice / candleData[candleData.length - 1].y[3] - 1) * 100).toFixed(2) : '0.00'}%
          </Badge>
        </div>
      )}

      {isClient && (
        <>
          <div className="h-[500px]">
            {candleData && candleData.length > 0 ? (
              <Chart
                options={options}
                series={[
                  {
                    name: 'Candles',
                    data: candleData
                  },
                  ...indicatorSeries
                ]}
                type="candlestick"
                height={500}
                width="100%"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <Skeleton className="h-[450px] w-full rounded-lg" />
              </div>
            )}
          </div>

          <div className="h-[120px]">
            {volumeData && volumeData.length > 0 ? (
              <Chart
                options={volumeOptions}
                series={[{
                  name: 'Volume',
                  data: volumeData
                }]}
                type="bar"
                height={120}
                width="100%"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <Skeleton className="h-[100px] w-full rounded-lg" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default TradingChart;
