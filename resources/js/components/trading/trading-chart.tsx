import React, { useState, useEffect, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import LoadingSpinner from '../ui/loading-spinner';
import ErrorMessage from '../ui/error-message';
import type { CurrencyPair } from '../../types/currency-pair';
import type { RawDataPoint } from '../../types/market-data';

// Define local types
interface CandleData {
    x: Date;
    y: [number, number, number, number]; // [open, high, low, close]
}

interface PredictionPoint {
    x: Date;
    y: number;
}

interface PredictionSeriesData {
    name: string;
    type: 'line';
    data: PredictionPoint[];
    color?: string;
    dashArray?: number;
}

interface TradingChartProps {
    pairId: number;
    timeframe: string;
    currencyPair?: CurrencyPair;
    historicalDataFn: (pairId: number, timeframe: string, count?: number) => Promise<CandleData[] | RawDataPoint[]>;
    predictiveMode?: boolean;
}

const TradingChart: React.FC<TradingChartProps> = ({
    pairId,
    timeframe,
    currencyPair,
    historicalDataFn,
    predictiveMode = false,
}) => {
    // Dark mode state (simplified for now)
    const isDarkMode = document.documentElement.classList.contains('dark');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [candleData, setCandleData] = useState<CandleData[]>([]);
    const [predictionSeriesData, setPredictionSeriesData] = useState<PredictionSeriesData[]>([]);
    
    // Default to 5 decimal places for most currency pairs
    const pipDigits = (currencyPair && currencyPair.symbol) ? (currencyPair.symbol.includes('JPY') ? 3 : 5) : 5;

    const predictionSeries = useMemo(() => {
        if (!predictiveMode || !candleData || candleData.length === 0) {
            return [];
        }
        const lastDataPoint = candleData[candleData.length - 1];
        const predictions: PredictionPoint[] = [];
        let lastTimestamp = new Date(lastDataPoint.x).getTime();
        let lastClose = lastDataPoint.y[3];

        for (let i = 1; i <= 10; i++) {
            lastTimestamp += 60 * 60 * 1000;
            lastClose = lastClose * (1 + (Math.random() - 0.5) * 0.01);
            predictions.push({
                x: new Date(lastTimestamp),
                y: lastClose
            });
        }

        return [{
            name: 'Prediction',
            type: 'line' as const,
            data: predictions,
            color: '#ADFF2F',
            dashArray: 5
        }];
    }, [predictiveMode, candleData]);

    useEffect(() => {
        setPredictionSeriesData(predictionSeries);
    }, [predictionSeries]);

    useEffect(() => {
        console.log('[TradingChart] useEffect triggered. Props:', { 
            pairId, 
            timeframe, 
            currencyPairName: currencyPair?.symbol, 
            hasHistoricalDataFn: !!historicalDataFn 
        });
        
        // Reset error state
        setError(null);
        
        // Validate props
        if (!pairId || isNaN(pairId) || !timeframe || !historicalDataFn) {
            console.log('[TradingChart] Invalid props, staying in loading state');
            return;
        }
        
        // Set loading state
        setIsLoading(true);
        
        const fetchData = async () => {
            try {
                const rawData = await historicalDataFn(pairId, timeframe);
                
                if (!Array.isArray(rawData) || rawData.length === 0) {
                    setError('No data available for the selected pair and timeframe');
                    setIsLoading(false);
                    return;
                }
                
                // Limit to the most recent 200 data points for performance
                const limitedData = rawData.slice(-200);
                
                console.log(`Processing ${limitedData.length} out of ${rawData.length} data points for better performance`);
                
                // Transform data for ApexCharts if needed
                let transformedData: CandleData[];
                
                // Check if the data is already in CandleData format
                if ('x' in limitedData[0] && 'y' in limitedData[0]) {
                    transformedData = limitedData as CandleData[];
                } else {
                    // Convert from RawDataPoint format
                    transformedData = (limitedData as RawDataPoint[])
                        .map((point): CandleData | null => {
                            if (
                                point &&
                                typeof point.timestamp !== 'undefined' &&
                                typeof point.open !== 'undefined' &&
                                typeof point.high !== 'undefined' &&
                                typeof point.low !== 'undefined' &&
                                typeof point.close !== 'undefined'
                            ) {
                                return {
                                    x: new Date(point.timestamp),
                                    y: [point.open, point.high, point.low, point.close]
                                };
                            }
                            return null;
                        })
                        .filter((item): item is CandleData => item !== null);
                }
                
                if (transformedData.length === 0) {
                    setError('Failed to process chart data');
                    setIsLoading(false);
                    return;
                }
                
                setCandleData(transformedData);
                setIsLoading(false);
            } catch (err) {
                console.error('[TradingChart] Error fetching data:', err);
                setError('Failed to fetch chart data. Please try again later.');
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, [pairId, timeframe, historicalDataFn, currencyPair?.symbol]);

    // Memoize chart options to prevent unnecessary re-renders
    const chartOptions = useMemo<ApexOptions>(() => {
        return {
            chart: {
                type: 'candlestick',
                height: 400,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
                animations: {
                    enabled: false, // Disable animations for better performance
                },
                background: 'transparent',
                parentHeightOffset: 0,
                offsetY: 0,
            },
            theme: {
                mode: isDarkMode ? 'dark' : 'light',
            },
            title: {
                text: currencyPair?.symbol ? `${currencyPair.symbol} (${timeframe})` : `Chart (${timeframe})`,
                align: 'left',
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    datetimeUTC: false,
                    formatter: function(value) {
                        // Safely handle the timestamp
                        return new Date(typeof value === 'number' ? value : 0).toLocaleString();
                    },
                    style: {
                        fontSize: '10px'
                    },
                    offsetY: 5
                },
                axisBorder: {
                    show: true
                },
                axisTicks: {
                    show: true
                }
            },
            yaxis: {
                tooltip: {
                    enabled: true,
                },
                labels: {
                    formatter: (value) => value.toFixed(pipDigits),
                },
            },
            tooltip: {
                enabled: true,
                theme: isDarkMode ? 'dark' : 'light',
                x: {
                    format: 'MMM dd HH:mm',
                },
            },
            grid: {
                borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                padding: {
                    bottom: 15
                }
            },
            margin: {
                bottom: 30
            },
            plotOptions: {
                candlestick: {
                    colors: {
                        upward: '#10b981', // Green for up candles
                        downward: '#ef4444', // Red for down candles
                    },
                    wick: {
                        useFillColor: true,
                    },
                },
            },
            responsive: [
                {
                    breakpoint: 1000,
                    options: {
                        chart: {
                            height: 400,
                        },
                    },
                },
                {
                    breakpoint: 600,
                    options: {
                        chart: {
                            height: 300,
                        },
                    },
                },
            ],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: 'smooth',
                width: 2,
            },
        };
    }, [currencyPair?.symbol, timeframe, isDarkMode, pipDigits]);

    const allSeries = useMemo(() => {
        const series = [];

        if (candleData && candleData.length > 0) {
            series.push({
                name: 'Price',
                type: 'candlestick',
                data: candleData
            });
        }

        if (predictiveMode && predictionSeriesData.length > 0) {
            series.push(...predictionSeriesData);
        }

        return series;
    }, [candleData, predictiveMode, predictionSeriesData]);

    return (
        <div className="w-full h-full p-2 bg-card text-card-foreground rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">
                    {currencyPair?.symbol ? `${currencyPair.symbol} (${timeframe})` : 'Loading Chart...'}
                </h2>
            </div>

            {isLoading ? (
                <LoadingSpinner className="h-[420px] w-full rounded-lg" />
            ) : error ? (
                <ErrorMessage className="flex items-center justify-center h-[420px] text-red-500 dark:text-red-400 border border-dashed border-red-300 dark:border-red-700 rounded-lg p-4">
                    <p>Error loading chart data: {error}</p>
                </ErrorMessage>
            ) : candleData.length === 0 ? (
                <div className="flex items-center justify-center h-[420px] text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                    <p>No valid data available for the selected pair and timeframe.</p>
                </div>
            ) : (
                <div className="chart-candlestick overflow-hidden pb-5">
                    <ReactApexChart
                        key={`${pairId}-${timeframe}`}
                        options={chartOptions}
                        series={allSeries}
                        type="candlestick"
                        height={400}
                        width="100%"
                    />
                </div>
            )}
        </div>
    );
};

export default TradingChart;