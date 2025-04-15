import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Zap, Loader2 } from 'lucide-react'; // Keep imports for potential future use
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface TradingChartProps {
  pairId: string;
  timeframe: string;
  predictiveMode: boolean; // Prop for simple prediction line toggle
  predictiveEnabled?: boolean; // Keep for potential future complex predictions
  historicalDataFn: (pairId: string, timeframe: string, count?: number) => Promise<CandleData[]>; // Expect a Promise returning CandleData[]
}

// Ensure consistent definition
interface CandleData {
  x: Date; // Use Date objects
  y: number[]; // [open, high, low, close, (optional volume)]
  pair?: string;
}

interface VolumeData {
  x: Date; // Use Date objects
  y: number;
}

// Define Prediction Series type (simple line)
interface PredictionSeriesData {
  x: Date; // Use Date objects
  y: number;
}

// Sample prediction data generator (can be replaced with actual logic)
const generateSamplePredictionData = (baseData: CandleData[]): ApexAxisChartSeries => {
  if (!baseData || baseData.length === 0) return [];

  const predictionSeriesData = baseData.map((point) => {
    if (!point || !point.x || !(point.x instanceof Date) || !Array.isArray(point.y) || point.y.length < 4) {
      console.warn('Skipping invalid point for prediction:', point);
      return null;
    }
    const closePrice = parseFloat(point.y[3].toString());
    if (isNaN(closePrice)) {
      console.warn('Skipping point with invalid close price for prediction:', point);
      return null;
    }
    return {
      x: point.x,
      y: closePrice + (Math.random() * 2 - 1) * 0.0005 // Simple random offset
    };
  }).filter((point): point is PredictionSeriesData => point !== null);

  predictionSeriesData.sort((a, b) => a.x.getTime() - b.x.getTime());

  return [{
    name: 'Prediction (Simulated)',
    type: 'line',
    data: predictionSeriesData,
    color: '#211DE4' // Example color
  }];
};


const TradingChart: React.FC<TradingChartProps> = ({
  pairId,
  timeframe,
  predictiveMode,
  // predictiveEnabled = false, // Keep if needed for future logic
  historicalDataFn // Now required and used
}) => {
  const [isClient, setIsClient] = useState(false);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [predictionSeries, setPredictionSeries] = useState<ApexAxisChartSeries>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [indicators, setIndicators] = useState({
    sma: true,
    ema: true,
    bollinger: true,
    // Add more indicators as needed
  });

  // Effect to set client-side flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper function to get pip multiplier (stable)
  const getForexPipMultiplier = useCallback((pair: string): number => {
    if (pair && pair.toUpperCase().includes('JPY')) return 100;
    return 10000;
  }, []);

  // Calculate pip multiplier and digits at component scope
  const pipMultiplier = useMemo(() => getForexPipMultiplier(pairId), [pairId, getForexPipMultiplier]);
  const pipDigits = useMemo(() => (pipMultiplier === 100 ? 2 : 4), [pipMultiplier]);

  // --- Data Fetching Logic ---
  useEffect(() => {
    const fetchData = async () => {
      if (!pairId || !timeframe || !historicalDataFn) {
        setLoading(false);
        setError("Missing required props for fetching data.");
        return;
      }
      setLoading(true);
      setError(null); // Clear previous errors
      setCandleData([]); // Clear old data
      setVolumeData([]);
      setPredictionSeries([]);

      try {
        const data = await historicalDataFn(pairId, timeframe, 200); // Use the prop function

        if (!data || data.length === 0) {
          console.warn(`No historical data received for ${pairId} (${timeframe}).`);
          setLoading(false);
          setError(`No data available for ${pairId} (${timeframe}).`);
          return;
        }

        // Ensure data is properly formatted (x should be Date, y should have >= 4 numbers)
        const fetchedCandles: CandleData[] = data
          .map(d => {
            // Ensure x is a Date object; handle potential string/number dates
            let dateObj: Date | null = null;
            if (d.x instanceof Date) {
                dateObj = d.x;
            } else if (typeof d.x === 'string' || typeof d.x === 'number') {
                dateObj = new Date(d.x);
            }
            // Validate y array structure
            if (dateObj && !isNaN(dateObj.getTime()) && Array.isArray(d.y) && d.y.length >= 4 && d.y.slice(0, 4).every(val => typeof val === 'number' && !isNaN(val))) {
              return {
                  ...d,
                  x: dateObj,
                  y: d.y // Keep original y array
              };
            }
            console.warn("Filtering invalid data point:", d);
            return null; // Mark invalid points for filtering
          })
          .filter((d): d is CandleData => d !== null) // Filter out nulls (invalid points)
          .sort((a, b) => a.x.getTime() - b.x.getTime()); // Ensure sorted by date

        if (fetchedCandles.length === 0) {
            console.warn(`No valid data points after filtering for ${pairId} (${timeframe}).`);
            setError(`No valid data points found for ${pairId} (${timeframe}).`);
            setLoading(false);
            return;
        }

        const fetchedVolumes: VolumeData[] = fetchedCandles.map(d => ({
          x: d.x,
          // Ensure volume (5th element, index 4) exists and is a number, default to 0
          y: (Array.isArray(d.y) && typeof d.y[4] === 'number' && !isNaN(d.y[4])) ? d.y[4] : 0
        }));

        setCandleData(fetchedCandles);
        setVolumeData(fetchedVolumes);

        // Generate predictions only if predictiveMode is on and we have valid candle data
        if (predictiveMode && fetchedCandles.length > 0) {
           const simPrediction = generateSamplePredictionData(fetchedCandles);
           setPredictionSeries(simPrediction);
        } else {
            setPredictionSeries([]); // Clear predictions if mode is off or no data
        }

      } catch (fetchError: any) {
        console.error('Error fetching historical data:', fetchError);
        setError(`Failed to fetch data: ${fetchError.message || 'Unknown error'}`);
        setCandleData([]); // Clear data on error
        setVolumeData([]);
        setPredictionSeries([]);
      } finally {
        setLoading(false); // Data processing finished
      }
    };

    fetchData();
  }, [pairId, timeframe, predictiveMode, historicalDataFn]); // Dependencies for fetching

  // --- Indicator Calculations (Memoized) ---
  const calculateSMA = useCallback((data: CandleData[], period: number): { x: Date, y: number }[] => {
    if (!data || data.length < period) return [];
    const closePrices = data.map(d => d.y[3]); // Assuming close is the 4th element

    const smaValues = [];
    for (let i = period - 1; i < closePrices.length; i++) {
      const slice = closePrices.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, val) => acc + val, 0);
      smaValues.push({ x: data[i].x, y: sum / period });
    }
    return smaValues;
  }, []);

  const calculateEMA = useCallback((data: CandleData[], period: number): { x: Date, y: number }[] => {
    if (!data || data.length < period) return [];
    const closePrices = data.map(d => d.y[3]);
    const emaValues = [];
    const k = 2 / (period + 1);
    let ema = closePrices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    emaValues.push({ x: data[period - 1].x, y: ema });

    for (let i = period; i < closePrices.length; i++) {
      ema = (closePrices[i] - ema) * k + ema;
      emaValues.push({ x: data[i].x, y: ema });
    }
    return emaValues;
  }, []);

  const calculateBollingerBands = useCallback((data: CandleData[], period: number, multiplier: number): { sma: { x: Date, y: number | null }[], upper: { x: Date, y: number | null }[], lower: { x: Date, y: number | null }[] } => {
    if (!data || data.length < period) return { sma: [], upper: [], lower: [] };
    const closePrices = data.map(d => d.y[3]);
    const smaLine: { x: Date, y: number | null }[] = [];
    const upperLine: { x: Date, y: number | null }[] = [];
    const lowerLine: { x: Date, y: number | null }[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            smaLine.push({ x: data[i].x, y: null });
            upperLine.push({ x: data[i].x, y: null });
            lowerLine.push({ x: data[i].x, y: null });
        } else {
            const slice = closePrices.slice(i - period + 1, i + 1);
            const sma = slice.reduce((a, b) => a + b, 0) / period;
            const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
            const stdDev = Math.sqrt(variance);
            smaLine.push({ x: data[i].x, y: sma });
            upperLine.push({ x: data[i].x, y: sma + multiplier * stdDev });
            lowerLine.push({ x: data[i].x, y: sma - multiplier * stdDev });
        }
    }
    return { sma: smaLine, upper: upperLine, lower: lowerLine };
  }, []);

  // Calculate indicator series whenever candle data or indicator toggles change
  const indicatorSeries = useMemo((): ApexAxisChartSeries => {
    if (!candleData || candleData.length === 0) return [];

    const series: ApexAxisChartSeries = [];

    if (indicators.sma) {
      const smaData = calculateSMA(candleData, 20);
      if (smaData.length > 0) {
          series.push({ name: 'SMA 20', data: smaData, type: 'line', color: '#FFA500', strokeWidth: 1 });
      }
    }
    if (indicators.ema) {
      const emaData = calculateEMA(candleData, 50);
      if (emaData.length > 0) {
          series.push({ name: 'EMA 50', data: emaData, type: 'line', color: '#8D5EB7', strokeWidth: 1 });
      }
    }
    if (indicators.bollinger) {
        const { sma, upper, lower } = calculateBollingerBands(candleData, 20, 2);
        // Don't add the middle band SMA if SMA indicator is already active
        if (!indicators.sma && sma.length > 0) {
             series.push({ name: 'BB Middle', data: sma, type: 'line', color: '#D04014', strokeWidth: 1, dashArray: 2 }); // Dashed line
        }
        if (upper.length > 0) {
            series.push({ name: 'BB Upper', data: upper, type: 'line', color: '#D04014', strokeWidth: 1 });
        }
        if (lower.length > 0) {
            series.push({ name: 'BB Lower', data: lower, type: 'line', color: '#D04014', strokeWidth: 1 });
        }
    }
    return series;
  }, [candleData, indicators, calculateSMA, calculateEMA, calculateBollingerBands]);

  // Indicator Toggle Function
  const toggleIndicator = useCallback((indicator: keyof typeof indicators) => {
    setIndicators(prev => ({ ...prev, [indicator]: !prev[indicator] }));
  }, []); // No dependencies needed

  // --- Chart Options (Memoized) ---
  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'candlestick',
      height: 500,
      id: `candles-${pairId}-${timeframe}`, // Unique ID
      group: `trading-${pairId}-${timeframe}`, // Sync group
      toolbar: { show: true, tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } },
      zoom: { enabled: true },
      animations: { enabled: false }, // Disable animations for stability
      background: 'transparent',
      foreColor: isClient ? (document.documentElement.classList.contains('dark') ? '#adb5bd' : '#333') : '#333', // Adapts to theme
    },
    grid: {
      borderColor: isClient ? (document.documentElement.classList.contains('dark') ? '#343a40' : '#e0e0e0') : '#e0e0e0',
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false, // Display in local time
        style: {
          colors: isClient ? (document.documentElement.classList.contains('dark') ? '#adb5bd' : '#555') : '#555'
        }
      },
      axisBorder: {
        color: isClient ? (document.documentElement.classList.contains('dark') ? '#495057' : '#d0d0d0') : '#d0d0d0'
      },
      axisTicks: {
        color: isClient ? (document.documentElement.classList.contains('dark') ? '#495057' : '#d0d0d0') : '#d0d0d0'
      },
      tooltip: { enabled: false } // Disable x-axis tooltip to avoid overlap
    },
    yaxis: {
      opposite: true,
      tooltip: { enabled: true },
      tickAmount: 8,
      labels: {
        style: {
          colors: isClient ? (document.documentElement.classList.contains('dark') ? '#adb5bd' : '#555') : '#555'
        },
        formatter: (value: number | undefined) => {
          if (value === undefined || value === null) return '';
          return value.toFixed(pipDigits); // Use pipDigits from component scope
        },
      },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10B981', // Green
          downward: '#EF4444' // Red
        },
        wick: { useFillColor: true }
      }
    },
    tooltip: {
      theme: isClient ? (document.documentElement.classList.contains('dark') ? 'dark' : 'light') : 'light',
      shared: true, // Show tooltip for all series at a point
      intersect: false, // Tooltip appears even when not directly hovering over the point/candle
      x: { format: 'dd MMM yyyy HH:mm' }, // Format date in tooltip
      y: { // Custom formatter for combined tooltip
        formatter: (value, { seriesIndex, dataPointIndex, w }) => {
          const seriesName = w.globals.seriesNames[seriesIndex];
          const decimalPlaces = pipDigits;

          if (seriesName === 'Candles') {
             // ApexCharts internals might change, use safe access
             const candleO = w.globals.seriesCandleO?.[0]?.[dataPointIndex];
             const candleH = w.globals.seriesCandleH?.[0]?.[dataPointIndex];
             const candleL = w.globals.seriesCandleL?.[0]?.[dataPointIndex];
             const candleC = w.globals.seriesCandleC?.[0]?.[dataPointIndex];

             if (candleO === undefined || candleH === undefined || candleL === undefined || candleC === undefined) return '';
             // Format the candle data
             return `
               <div class="apexcharts-tooltip-candlestick">
                 <div>Open: <span style="font-weight:bold">${candleO.toFixed(decimalPlaces)}</span></div>
                 <div>High: <span style="font-weight:bold">${candleH.toFixed(decimalPlaces)}</span></div>
                 <div>Low: <span style="font-weight:bold">${candleL.toFixed(decimalPlaces)}</span></div>
                 <div>Close: <span style="font-weight:bold">${candleC.toFixed(decimalPlaces)}</span></div>
               </div>
             `;
          } else if (typeof value === 'number') {
            // Default formatter for other line series (indicators, prediction)
            return `<div class="apexcharts-tooltip-series-item" style="display: flex; justify-content: space-between; padding: 2px 0;"><span>${seriesName}:</span> <span style="font-weight:bold">${value.toFixed(decimalPlaces)}</span></div>`;
          }
          return ''; // Return empty string if value is not suitable
        },
      },
      // Style the tooltip (optional)
      style: {
          fontSize: '12px',
          fontFamily: undefined
      },
      items: { // Ensure consistent item display order if needed
          display: 'flex',
      },
      fixed: { // Prevent tooltip from going off-screen (optional)
          enabled: false,
          position: 'topRight',
          offsetX: 0,
          offsetY: 0,
      },
       marker: {
          show: false // Hide markers in tooltip for line series
      }
    },
    stroke: {
       width: [1.5, 1, 1, 1, 1, 1] // Default widths [Candles, Pred, SMA, EMA, BB Upper, BB Lower] - Adjust if adding more series
    },
    legend: {
      show: false // Using badges for legend control
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 0 // No markers on lines by default
    },
  }), [pairId, timeframe, isClient, pipDigits]); // Dependencies: Recalculate if pair, timeframe, or theme changes. pipDigits is stable.

  // Volume Chart Options (Memoized)
  const volumeOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 120,
      id: `volume-${pairId}-${timeframe}`, // Unique ID
      group: `trading-${pairId}-${timeframe}`, // Sync group
      toolbar: { show: false },
      zoom: { enabled: false }, // Disable zoom on volume chart
      animations: { enabled: false },
      background: 'transparent',
      foreColor: isClient ? (document.documentElement.classList.contains('dark') ? '#adb5bd' : '#333') : '#333',
    },
    plotOptions: {
      bar: {
        columnWidth: '80%',
         // Color volume bars based on candle direction (needs access to candle data)
         // This function runs for each bar
        colors: {
            ranges: [], // Clear default ranges
            backgroundBarColors: [],
            backgroundBarOpacity: 1,
            backgroundBarRadius: 0,
        },
      }
    },
     fill: {
        // Color bars based on corresponding candle's direction
        // Requires candleData to be available in this scope
        colors: [({ value, seriesIndex, dataPointIndex, w }) => {
            // Check if candleData exists and has the corresponding point
            if (candleData && candleData[dataPointIndex] && Array.isArray(candleData[dataPointIndex].y) && candleData[dataPointIndex].y.length >= 4) {
                const open = candleData[dataPointIndex].y[0];
                const close = candleData[dataPointIndex].y[3];
                if (close >= open) {
                    return '#10B981'; // Green for up candle
                } else {
                    return '#EF4444'; // Red for down candle
                }
            }
            // Default color if data is unavailable
            return isClient ? (document.documentElement.classList.contains('dark') ? '#444' : '#ccc') : '#ccc';
        }]
     },
    dataLabels: { enabled: false },
    xaxis: {
      type: 'datetime',
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
       tooltip: { enabled: false } // Disable x-axis tooltip
    },
    yaxis: {
      opposite: true,
      tickAmount: 3,
      labels: {
        show: true,
        style: {
          colors: isClient ? (document.documentElement.classList.contains('dark') ? '#adb5bd' : '#555') : '#555'
        },
        formatter: (value: number | undefined) => {
          if (value === undefined || value === null) return '0';
          if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
          if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
          if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
          return value.toFixed(0);
        }
      },
    },
    grid: {
      borderColor: isClient ? (document.documentElement.classList.contains('dark') ? '#343a40' : '#e0e0e0') : '#e0e0e0',
      yaxis: { lines: { show: true } },
       xaxis: { lines: { show: false } } // Hide vertical grid lines
    },
    tooltip: {
      enabled: true,
      theme: isClient ? (document.documentElement.classList.contains('dark') ? 'dark' : 'light') : 'light',
      x: { show: false }, // Don't show date again, it's in the main chart tooltip
      y: {
        title: { formatter: () => 'Volume: ' },
        formatter: (value: number | undefined) => value?.toLocaleString() ?? '0'
      }
    },
  }), [pairId, timeframe, isClient, candleData]); // Dependencies: Recalculate if pair, timeframe, theme, or candleData (for bar colors) changes.

  // --- Render Logic ---

  // Display loading skeletons
  if (loading) {
    return (
      <div className="space-y-2">
        {/* Skeleton for badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.keys(indicators).map((key) => <Skeleton key={key} className="h-6 w-16 rounded-full" />)}
        </div>
        {/* Skeleton for charts */}
        <Skeleton className="h-[500px] w-full rounded-lg" />
        <Skeleton className="h-[120px] w-full rounded-lg" />
      </div>
    );
  }

  // Display error message if fetch failed
  if (error) {
    return (
       <div className="flex items-center justify-center h-[620px] text-red-500 dark:text-red-400 border border-dashed border-red-300 dark:border-red-700 rounded-lg p-4">
           <p>Error loading chart data: {error}</p>
       </div>
    );
  }

  // Display message if no data after filtering
  if (candleData.length === 0) {
       return (
        <div className="flex items-center justify-center h-[620px] text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
           <p>No valid data available for the selected pair and timeframe.</p>
       </div>
    );
  }

  // Combine all series for the main chart
  const processedCandleData = candleData.map(d => ({
    x: d.x,
    y: [d.y[0], d.y[1], d.y[2], d.y[3]] // Ensure y has exactly 4 elements
  }));

  const allSeries = [
    { name: 'Candles', type: 'candlestick', data: processedCandleData }, // Use processed data
    ...predictionSeries, // Add prediction line if available
    ...indicatorSeries, // Add active indicator lines
  ];

  // Main Render when data is ready
  return (
    <div className="trading-chart-container">
      {/* Indicator Badges */}
      <div className="flex flex-wrap gap-2 mb-2">
         <Badge variant={indicators.sma ? 'default' : 'outline'} className={`cursor-pointer ${indicators.sma ? 'border-[#FFA500] bg-[#FFA500]/10 text-[#FFA500]' : ''}`} onClick={() => toggleIndicator('sma')}>SMA</Badge>
         <Badge variant={indicators.ema ? 'default' : 'outline'} className={`cursor-pointer ${indicators.ema ? 'border-[#8D5EB7] bg-[#8D5EB7]/10 text-[#8D5EB7]' : ''}`} onClick={() => toggleIndicator('ema')}>EMA</Badge>
         <Badge variant={indicators.bollinger ? 'default' : 'outline'} className={`cursor-pointer ${indicators.bollinger ? 'border-[#D04014] bg-[#D04014]/10 text-[#D04014]' : ''}`} onClick={() => toggleIndicator('bollinger')}>BB</Badge>
         {/* Add more badges for other indicators */}
      </div>

      {/* Render charts only on client-side */}
      {isClient && (
        <>
          <div className="chart-candlestick">
            <Chart
              options={options}
              series={allSeries} // Use combined series
              type="candlestick"
              height={500}
              width="100%"
            />
          </div>
          <div className="chart-volume mt-[-20px]"> {/* Negative margin to reduce gap */}
            <Chart
              options={volumeOptions}
              series={[{ name: 'Volume', data: volumeData }]}
              type="bar"
              height={120}
              width="100%"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TradingChart;