import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import type { RawDataPoint } from '@/types/market-data';

// Define local types
interface CandleData {
    x: Date;            // Timestamp
    y: number[];        // [open, high, low, close]
}

interface TradingChartProps {
    pairSymbol: string;
    timeframe: string;
    historicalDataFn: (pairSymbol: string, timeframe: string, count?: number) => Promise<CandleData[] | RawDataPoint[]>;
    predictiveMode?: boolean;
}

const TradingChart: React.FC<TradingChartProps> = ({
    pairSymbol,
    timeframe,
    historicalDataFn,
    predictiveMode = false,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [series, setSeries] = useState<ApexAxisChartSeries>([]);
    const [options, setOptions] = useState<ApexOptions>({});

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');

    useEffect(() => {
        setError(null);
        if (!pairSymbol || !timeframe || !historicalDataFn) {
            console.log('[TradingChart] Invalid props, staying in loading state');
            return;
        }

        setIsLoading(true);

        const fetchDataAndSetupChart = async () => {
            try {
                const rawData = await historicalDataFn(pairSymbol, timeframe, 200); // Request 200 points

                if (!Array.isArray(rawData) || rawData.length === 0) {
                    setError('No data available for the selected pair and timeframe');
                    setIsLoading(false);
                    return;
                }

                let transformedData: CandleData[] = [];
                if ('timestamp' in rawData[0] && 'open' in rawData[0]) {
                    transformedData = (rawData as RawDataPoint[]).map(point => ({
                        x: new Date(point.timestamp),
                        y: [
                            Number(point.open),
                            Number(point.high),
                            Number(point.low),
                            Number(point.close),
                        ],
                    }));
                } else {
                    transformedData = rawData as CandleData[];
                }

                if (transformedData.length === 0) {
                    setError('Failed to process chart data');
                    setIsLoading(false);
                    return;
                }

                // Sort data just in case it's not ordered
                transformedData.sort((a, b) => a.x.getTime() - b.x.getTime());

                const candlestickSeries = {
                    name: 'Price',
                    type: 'candlestick',
                    data: transformedData,
                };

                const tempSeries: ApexAxisChartSeries = [candlestickSeries]; 
                const tempPredictionData: { x: Date; y: number }[] = []; 

                // Generate simple prediction data (linear trend based on last 2 points)
                if (predictiveMode && transformedData.length >= 2) {
                    const lastPoint = transformedData[transformedData.length - 1];
                    const secondLastPoint = transformedData[transformedData.length - 2];
                    const lastClose = lastPoint.y[3];
                    const secondLastClose = secondLastPoint.y[3];
                    const timeDiff = lastPoint.x.getTime() - secondLastPoint.x.getTime();
                    const priceDiff = lastClose - secondLastClose;
                    const trendPerMs = timeDiff > 0 ? priceDiff / timeDiff : 0;

                    let currentPredictionTime = lastPoint.x.getTime();
                    let currentPredictionPrice = lastClose;

                    for (let i = 1; i <= 10; i++) {
                        currentPredictionTime += timeDiff; // Assume same interval
                        currentPredictionPrice += trendPerMs * timeDiff;
                        tempPredictionData.push({ 
                            x: new Date(currentPredictionTime), 
                            y: currentPredictionPrice 
                        });
                    }

                    tempSeries.push({ 
                        name: 'Prediction',
                        type: 'line',
                        data: tempPredictionData, 
                        color: '#D04014', // Brand color for prediction
                    });
                }

                setSeries(tempSeries); 

                // Define Chart Options
                setOptions({
                    chart: {
                        type: 'candlestick',
                        height: 400,
                        background: 'transparent', // Use CSS for background
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
                            },
                        },
                        animations: {
                           enabled: false // Disable animation on data update for smoother feel
                        }
                    },
                    theme: {
                        mode: isDarkMode ? 'dark' : 'light',
                    },
                    title: {
                        text: `${pairSymbol} (${timeframe})`,
                        align: 'left',
                        style: {
                           color: isDarkMode ? '#F9F9F9' : '#1A161D',
                        }
                    },
                    xaxis: {
                        type: 'datetime',
                        labels: {
                            style: {
                                colors: isDarkMode ? '#E1E1E6' : '#333333'
                            }
                        },
                        tooltip: {
                           enabled: true,
                        }
                    },
                    yaxis: {
                        tooltip: {
                            enabled: true,
                        },
                        labels: {
                           style: {
                                colors: isDarkMode ? '#E1E1E6' : '#333333'
                           },
                           formatter: function (value) {
                                return value.toFixed(5); // Forex usually needs precision
                           }
                        }
                    },
                    tooltip: {
                        shared: true,
                        intersect: false, 
                        theme: isDarkMode ? 'dark' : 'light',
                        y: {
                            formatter: function (val, { seriesIndex, dataPointIndex, w }) {
                                // Type assertion needed as ApexCharts types might be generic
                                const configSeries = w.config.series as ApexAxisChartSeries; 
                                const seriesType = configSeries[seriesIndex].type;
                                const dataPoint = configSeries[seriesIndex].data[dataPointIndex] as CandleData | { x: Date; y: number }; // Type assertion

                                if (seriesType === 'candlestick' && typeof dataPoint === 'object' && dataPoint !== null && 'y' in dataPoint && Array.isArray(dataPoint.y)) {
                                    const ohlc = dataPoint.y;
                                    return `O: ${ohlc[0].toFixed(5)} H: ${ohlc[1].toFixed(5)} L: ${ohlc[2].toFixed(5)} C: ${ohlc[3].toFixed(5)}`;
                                } else if (typeof val === 'number') {
                                    return val.toFixed(5);
                                }
                                return ''; // Fallback for unexpected types
                            }
                        },
                    },
                    plotOptions: {
                        candlestick: {
                            colors: {
                                upward: '#8D5EB7', // Brand color for upward candles
                                downward: '#D04014' // Brand color for downward candles (or choose another)
                            },
                            wick: {
                               useFillColor: true,
                            }
                        }
                    },
                    stroke: {
                        width: [1, 2], // Candlestick border, Prediction line
                        curve: 'smooth'
                    },
                    markers: {
                        size: predictiveMode ? [0, 4] : [0], // Only show markers for prediction line
                        hover: {
                           sizeOffset: 2
                        }
                    },
                    noData: {
                        text: 'Loading chart data...',
                        align: 'center',
                        verticalAlign: 'middle',
                        offsetX: 0,
                        offsetY: 0,
                        style: {
                            color: isDarkMode ? '#F9F9F9' : '#1A161D',
                            fontSize: '14px',
                        }
                    }
                });

                setIsLoading(false);
            } catch (err) {
                console.error('[TradingChart] Error fetching or processing data:', err);
                setError('Failed to load chart data. Please try again later.');
                setIsLoading(false);
            }
        };

        fetchDataAndSetupChart();

        // Add resize listener for responsiveness
        const handleResize = () => {
           // ApexCharts handles responsiveness automatically based on container size
           // No specific action needed here unless forcing a redraw, which is usually not necessary
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, [pairSymbol, timeframe, historicalDataFn, predictiveMode, isDarkMode]); // Re-run if mode changes

    return (
        <div className="w-full bg-card text-card-foreground rounded-lg border shadow-sm p-4">
            {isLoading ? (
                <LoadingSpinner className="h-[420px] w-full" />
            ) : error ? (
                <ErrorMessage className="flex items-center justify-center h-[420px] text-red-500 dark:text-red-400 border border-dashed border-red-300 dark:border-red-700 rounded-lg p-4">
                    <p>{error}</p>
                </ErrorMessage>
            ) : series.length > 0 && series[0].data && series[0].data.length > 0 ? (
                <div id="chart-candlestick" className="chart-candlestick">
                    {/* Conditional rendering to ensure Chart component mounts only when options/series are ready */}
                    {options.chart && series.length > 0 && (
                        <Chart
                            options={options}
                            series={series}
                            type="candlestick"
                            height={400}
                            width="100%"
                        />
                    )}
                </div>
            ) : (
                 <div className="flex items-center justify-center h-[420px] text-muted-foreground border border-dashed border-border rounded-lg p-4">
                     <p>No valid data available to display the chart.</p>
                 </div>
            )}
        </div>
    );
};

export default TradingChart;