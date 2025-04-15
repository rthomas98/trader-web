import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios'; // Import axios
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface TradingChartProps {
  pairId: string;
  timeframe: string;
  predictiveMode: boolean; // Prop for simple prediction line toggle
  historicalDataFn: (pairId: string, timeframe: string, count?: number) => Promise<CandleData[]>; // Expect a Promise returning CandleData[]
  onPredictionLoadingChange?: (isLoading: boolean) => void; // Callback for loading state
  onPredictionError?: (error: string | null) => void; // Callback for error state
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

// Define Prediction API data type
interface PredictiveApiDataPoint {
  timestamp: number; // Expecting milliseconds timestamp from backend
  price: number;
}

const TradingChart: React.FC<TradingChartProps> = ({
  pairId,
  timeframe,
  predictiveMode,
  historicalDataFn, // Now required and used
  onPredictionLoadingChange,
  onPredictionError
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
      setPredictionSeries([]); // Clear old predictions

      try {
        // Fetch historical data (always needed)
        const historicalData = await historicalDataFn(pairId, timeframe, 200); // Use the prop function

        if (!historicalData || historicalData.length === 0) {
          throw new Error("No historical data received.");
        }

        // Process historical data
        const processedCandleData: CandleData[] = [];
        const processedVolumeData: VolumeData[] = [];

        historicalData.forEach(point => {
          if (point && point.x && point.y && Array.isArray(point.y) && point.y.length >= 4) {
            const date = new Date(point.x); // Ensure x is a Date object
            if (!isNaN(date.getTime())) {
              processedCandleData.push({ x: date, y: point.y.slice(0, 4) });
              // Assume volume is the 5th element if present, otherwise use 0
              const volume = point.y.length >= 5 && typeof point.y[4] === 'number' ? point.y[4] : 0;
              processedVolumeData.push({ x: date, y: volume });
            } else {
              console.warn("Skipping invalid date in historical data:", point.x);
            }
          } else {
            console.warn("Skipping invalid historical data point:", point);
          }
        });
        
        // Sort data just in case it's not
        processedCandleData.sort((a, b) => a.x.getTime() - b.x.getTime());
        processedVolumeData.sort((a, b) => a.x.getTime() - b.x.getTime());

        if (processedCandleData.length === 0) {
          throw new Error("No valid historical data points found after processing.");
        }

        setCandleData(processedCandleData);
        setVolumeData(processedVolumeData);

        // Fetch predictive data only if predictiveMode is true
        if (predictiveMode) {
          try {
            const predictiveResponse = await axios.get('/trading/predictive-data', {
              params: {
                pair: pairId,
                timeframe: timeframe,
                count: 200 // Match historical count for context
              }
            });
            
            if (predictiveResponse.data && predictiveResponse.data.success && Array.isArray(predictiveResponse.data.data)) {
                const rawPredictiveData: PredictiveApiDataPoint[] = predictiveResponse.data.data;
                
                const processedPredictiveData = rawPredictiveData
                    .map(p => {
                        const date = new Date(p.timestamp); // Convert timestamp to Date
                        return !isNaN(date.getTime()) && typeof p.price === 'number' 
                            ? { x: date, y: p.price } 
                            : null;
                    })
                    .filter((p): p is PredictionSeriesData => p !== null);

                processedPredictiveData.sort((a, b) => a.x.getTime() - b.x.getTime());

                setPredictionSeries([
                  {
                    name: 'Prediction',
                    type: 'line',
                    data: processedPredictiveData,
                    color: '#211DE4', // Brand blue
                  }
                ]);
            } else {
                console.warn('Predictive data fetch failed or returned invalid format:', predictiveResponse.data);
                setError('Failed to load predictive data.'); // Set error but don't stop rendering historical
            }
          } catch (predictiveError: unknown) { // Type the caught error
             console.error('Error fetching predictive data:', predictiveError);
             setError('Error loading predictive data.'); // Set error but don't stop rendering historical
          }
        }

      } catch (err: unknown) { // Type the caught error
        console.error('Error fetching or processing chart data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart data.');
        setCandleData([]);
        setVolumeData([]);
        setPredictionSeries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Dependencies: Fetch data when pairId, timeframe, historicalDataFn, or predictiveMode changes
  }, [pairId, timeframe, historicalDataFn, predictiveMode, onPredictionLoadingChange, onPredictionError]); 

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
          series.push({ 
            name: 'SMA 20', 
            data: smaData, 
            type: 'line', 
            color: '#FFA500' 
          });
      }
    }
    if (indicators.ema) {
      const emaData = calculateEMA(candleData, 50);
      if (emaData.length > 0) {
          series.push({ 
            name: 'EMA 50', 
            data: emaData, 
            type: 'line', 
            color: '#8D5EB7' 
          });
      }
    }
    if (indicators.bollinger) {
        const { sma, upper, lower } = calculateBollingerBands(candleData, 20, 2);
        // Don't add the middle band SMA if SMA indicator is already active
        if (!indicators.sma && sma.length > 0) {
             series.push({ 
                name: 'BB Middle', 
                data: sma, 
                type: 'line', 
                color: '#D04014' 
             }); // Dashed line
        }
        if (upper.length > 0) {
            series.push({ 
                name: 'BB Upper', 
                data: upper, 
                type: 'line', 
                color: '#D04014' 
            });
        }
        if (lower.length > 0) {
            series.push({ 
                name: 'BB Lower', 
                data: lower, 
                type: 'line', 
                color: '#D04014' 
            });
        }
    }
    return series;
  }, [candleData, indicators, calculateSMA, calculateEMA, calculateBollingerBands]);

  // Indicator Toggle Function
  const toggleIndicator = useCallback((indicator: keyof typeof indicators) => {
    setIndicators(prev => ({ ...prev, [indicator]: !prev[indicator] }));
  }, []); // No dependencies needed

  // Construct the final series array first
  const finalSeries = useMemo(() => {
      const series: ApexAxisChartSeries = [
          { name: 'Candlestick', type: 'candlestick', data: candleData },
          ...indicatorSeries,
          ...(predictiveMode && predictionSeries.length > 0 ? predictionSeries : [])
      ];
      return series;
  }, [candleData, indicatorSeries, predictiveMode, predictionSeries]);

  // Dynamically generate stroke settings based on the final series array
  const { strokeWidths, strokeDashArrays } = useMemo(() => {
      const widths: number[] = [];
      const dashes: number[] = [];
      finalSeries.forEach(series => {
          let width = 1; // Default width
          let dash = 0; // Default solid

          if (series.type === 'line') {
              if (series.name?.startsWith('Prediction')) {
                  width = 2;
                  dash = 5; // Dashed for prediction
              } else if (series.name === 'BB Middle') {
                  dash = 2; // Dashed for BB Middle
              }
              // Add other specific indicator styling here if needed
          } else if (series.type === 'candlestick') {
              width = 1; // Ensure candlestick has appropriate width setting if needed by stroke array
          }

          widths.push(width);
          dashes.push(dash);
      });
      return { strokeWidths: widths, strokeDashArrays: dashes };
  }, [finalSeries]);

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
      y: { 
        formatter: (value, { dataPointIndex }: { dataPointIndex: number }) => {
          const candle = candleData[dataPointIndex]; // Assumes candleData is synced

          if (!candle || !candle.x || !Array.isArray(candle.y) || candle.y.length < 4) {
            return ''; // Basic check
          }

          const o = candle.y[0]?.toFixed(pipDigits);
          const h = candle.y[1]?.toFixed(pipDigits);
          const l = candle.y[2]?.toFixed(pipDigits);
          const c = candle.y[3]?.toFixed(pipDigits);
          const volume = volumeData[dataPointIndex]?.y ?? 0;

          let tooltipHtml = `
            <div class="apexcharts-tooltip-candlestick p-2 rounded shadow-lg bg-background border border-border">
              <div class="font-semibold mb-1">${candle.x.toLocaleString()}</div>
              <div><span class="font-medium">O:</span> ${o}</div>
              <div><span class="font-medium">H:</span> ${h}</div>
              <div><span class="font-medium">L:</span> ${l}</div>
              <div><span class="font-medium">C:</span> ${c}</div>
              <div><span class="font-medium">Vol:</span> ${volume.toLocaleString()}</div>
          `;

          // Add prediction value if available and mode is on
          if (predictiveMode && predictionSeries.length > 0 && predictionSeries[0].data.length > dataPointIndex) {
            const predictionPoint = predictionSeries[0].data[dataPointIndex] as PredictionSeriesData | undefined;
            if (predictionPoint && predictionPoint.y !== undefined) {
              tooltipHtml += `<div class="mt-1 pt-1 border-t border-border"><span class="font-medium text-blue-500">Pred:</span> ${predictionPoint.y.toFixed(pipDigits)}</div>`;
            }
          }
          
           // Add indicator values if available
          indicatorSeries.forEach(indSeries => {
            const indPoint = indSeries.data[dataPointIndex] as { x: Date, y: number } | undefined;
            if (indPoint?.y !== undefined) {
               tooltipHtml += `<div><span class="font-medium" style="color:${indSeries.color};">${indSeries.name}:</span> ${indPoint.y.toFixed(pipDigits)}</div>`;
            }
          });

          tooltipHtml += `</div>`;
          return tooltipHtml;
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
       width: strokeWidths, // Use dynamic widths
       dashArray: strokeDashArrays, // Use dynamic dashes
       curve: 'smooth',
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
  }), [
      pairId, 
      timeframe, 
      isClient, 
      pipDigits, 
      candleData, 
      indicatorSeries, 
      predictionSeries, 
      predictiveMode, 
      strokeWidths, 
      strokeDashArrays
  ]);

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
        colors: [({ dataPointIndex }: { dataPointIndex: number }) => { // Type dataPointIndex
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
        formatter: (value: number | string | undefined): string => { // Ensure value is number or string
            if (typeof value === 'number') return value.toLocaleString();
            if (typeof value === 'string') return parseFloat(value).toLocaleString(); // Attempt conversion if string
            return '0';
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
  }), [pairId, timeframe, isClient, candleData]);

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
    // Conditionally add prediction series if predictiveMode is true and data exists
    ...(predictiveMode && predictionSeries.length > 0 ? predictionSeries.map(series => ({
          ...series,
          type: 'line', // Ensure it's a line
          stroke: {
              width: 2,
              dashArray: 5, // Make it dashed
              curve: 'smooth' // Optional: smooth line
          },
      })) : []), 
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