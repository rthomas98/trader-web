import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { PageProps, Breadcrumb as BreadcrumbType } from '@/types'; 
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Terminal, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider'; 
import Chart from 'react-apexcharts'; 
import { ApexOptions } from 'apexcharts'; 

// --- Type Definitions ---
interface Trade {
    type: 'buy' | 'sell';
    entry_timestamp: string;
    entry_price: number;
    exit_timestamp: string | null;
    exit_price: number | null;
    reason: string;
}

interface PerformanceMetrics {
    initialCapital: number;
    finalCapital: number;
    netProfit: number;
    netProfitPercentage: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
}

interface BacktestParameters {
    strategy: string;
    instrument: string;
    timeframe: string;
    initialCapital: string; 
}

interface BacktestResults {
    status: 'success' | 'error';
    message: string;
    parameters: BacktestParameters;
    data_points_fetched: number;
    trades: Trade[];
    performance: PerformanceMetrics;
}

interface StrategyBacktestingProps extends PageProps {
    breadcrumbs: BreadcrumbType[];
}

export default function StrategyBacktestingIndex({ auth, breadcrumbs }: StrategyBacktestingProps) {
    const [strategy, setStrategy] = useState('');
    const [instrument, setInstrument] = useState('');
    const [timeframe, setTimeframe] = useState('');
    const [initialCapital, setInitialCapital] = useState<string>('10000');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<BacktestResults | null>(null);
    const [chartOptions, setChartOptions] = useState<ApexOptions>({});
    const [chartSeries, setChartSeries] = useState<ApexAxisChartSeries>([]);
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme(); 

    const handleRunBacktest = () => {
        setIsLoading(true);
        setResults(null);
        setError(null);

        fetch(route('strategy-backtesting.run'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
            },
            body: JSON.stringify({ strategy, instrument, timeframe, initialCapital })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setResults(data);
            if (data.status === 'success') {
                const equityData = calculateEquityCurve(data.trades, data.parameters.initialCapital);
                updateChartData(equityData, theme);
            }
        })
        .catch(error => {
            console.error('Error fetching backtest results:', error);
            setError('Failed to fetch backtest results. Please try again.');
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    const calculateEquityCurve = (trades: Trade[], initialCapitalStr: string): { x: number; y: number }[] => {
        const initialCapital = parseFloat(initialCapitalStr);
        let currentEquity = initialCapital;
        const equityPoints: { x: number; y: number }[] = [];

        const startTime = trades.length > 0 ? new Date(trades[0].entry_timestamp).getTime() : Date.now();
        equityPoints.push({ x: startTime, y: initialCapital });

        const closedTrades = trades
            .filter(trade => trade.exit_timestamp && trade.exit_price !== null)
            .sort((a, b) => new Date(a.exit_timestamp!).getTime() - new Date(b.exit_timestamp!).getTime());

        closedTrades.forEach(trade => {
            const entryPrice = trade.entry_price;
            const exitPrice = trade.exit_price!;
            let profitLoss = 0;

            if (trade.type === 'buy') {
                profitLoss = exitPrice - entryPrice;
            } else if (trade.type === 'sell') {
                profitLoss = entryPrice - exitPrice;
            }

            currentEquity += profitLoss;
            equityPoints.push({ x: new Date(trade.exit_timestamp!).getTime(), y: currentEquity });
        });

        return equityPoints;
    };

    const updateChartData = (equityData: { x: number; y: number }[], currentTheme: string) => {
        setChartSeries([{ name: 'Equity', data: equityData }]);

        setChartOptions({
            chart: {
                type: 'line',
                height: 350,
                zoom: {
                    enabled: true
                },
                toolbar: {
                    show: true
                },
                background: 'transparent'
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    style: {
                        colors: currentTheme === 'dark' ? '#e2e8f0' : '#000000',
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Equity (USD)',
                    style: {
                        color: currentTheme === 'dark' ? '#e2e8f0' : '#000000',
                    }
                },
                labels: {
                    formatter: function (value) {
                        return "$" + value.toFixed(2);
                    },
                    style: {
                        colors: currentTheme === 'dark' ? '#e2e8f0' : '#000000',
                    }
                }
            },
            tooltip: {
                x: {
                    format: 'dd MMM yyyy HH:mm'
                },
                y: {
                    formatter: function (value) {
                        return "$" + value.toFixed(2);
                    }
                },
                theme: currentTheme
            },
            grid: {
                borderColor: currentTheme === 'dark' ? '#374151' : '#e5e7eb',
                xaxis: {
                    lines: {
                        show: true
                    }
                },
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            noData: {
                text: 'Not enough data to display equity curve.',
                style: {
                    color: currentTheme === 'dark' ? '#e2e8f0' : '#000000',
                }
            },
            theme: {
                mode: currentTheme as 'light' | 'dark'
            }
        });
    };

    useEffect(() => {
        if (results?.status === 'success') {
            const equityData = calculateEquityCurve(results.trades, results.parameters.initialCapital);
            updateChartData(equityData, theme);
        }
    }, [theme, results]);

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Strategy Backtesting</h2>}
        >
            <Head title="Strategy Backtesting" />

            <div className="py-4 px-4 sm:px-6 lg:px-8">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configure Backtest</CardTitle>
                            <CardDescription>Select your strategy, instrument, timeframe, and initial capital.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="strategy">Strategy</Label>
                                    <Select onValueChange={setStrategy} value={strategy}>
                                        <SelectTrigger id="strategy">
                                            <SelectValue placeholder="Select Strategy" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ma_cross">Moving Average Crossover</SelectItem>
                                            <SelectItem value="rsi_divergence">RSI Divergence</SelectItem>
                                            {/* Add more strategies */}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instrument">Instrument</Label>
                                    <Select onValueChange={setInstrument} value={instrument}>
                                        <SelectTrigger id="instrument">
                                            <SelectValue placeholder="Select Instrument" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EUR_USD">EUR/USD</SelectItem>
                                            <SelectItem value="GBP_USD">GBP/USD</SelectItem>
                                            <SelectItem value="USD_JPY">USD/JPY</SelectItem>
                                            {/* Add more instruments */}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timeframe">Timeframe</Label>
                                    <Select onValueChange={setTimeframe} value={timeframe}>
                                        <SelectTrigger id="timeframe">
                                            <SelectValue placeholder="Select Timeframe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="M15">15 Minutes</SelectItem>
                                            <SelectItem value="H1">1 Hour</SelectItem>
                                            <SelectItem value="D1">Daily</SelectItem>
                                            {/* Add more timeframes */}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="initial-capital">Initial Capital ($)</Label>
                                    <Input
                                        id="initial-capital"
                                        type="number"
                                        value={initialCapital}
                                        onChange={(e) => setInitialCapital(e.target.value)}
                                        placeholder="e.g., 10000"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleRunBacktest} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? 'Running...' : 'Run Backtest'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Backtest Results</CardTitle>
                            <CardDescription>Performance metrics and charts will be displayed here.</CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-[10rem] flex flex-col">
                            {isLoading && (
                                <div className="flex flex-1 items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <p className="ml-2 text-muted-foreground">Running simulation...</p>
                                </div>
                            )}
                            {error && !isLoading && (
                                <Alert variant="destructive">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {results && !isLoading && results.status === 'success' && (
                                <div className="space-y-6">
                                    {/* Performance Metrics Section */}
                                    <h3 className="text-lg font-medium">Performance Metrics</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                                        <MetricItem label="Initial Capital" value={formatCurrency(results.performance.initialCapital)} />
                                        <MetricItem label="Final Capital" value={formatCurrency(results.performance.finalCapital)} />
                                        <MetricItem label="Net Profit" value={formatCurrency(results.performance.netProfit)} />
                                        <MetricItem label="Net Profit %" value={`${results.performance.netProfitPercentage.toFixed(2)}%`} />
                                        <MetricItem label="Total Trades" value={results.performance.totalTrades} />
                                        <MetricItem label="Winning Trades" value={results.performance.winningTrades} />
                                        <MetricItem label="Losing Trades" value={results.performance.losingTrades} />
                                        <MetricItem label="Win Rate" value={`${results.performance.winRate.toFixed(2)}%`} />
                                        <MetricItem label="Data Points Used" value={results.data_points_fetched} />
                                    </div>

                                    {/* Trades Table Section */}
                                    <h3 className="text-lg font-medium">Trades</h3>
                                    <Table>
                                        <TableCaption>A list of simulated trades.</TableCaption>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Entry Time</TableHead>
                                                <TableHead className="text-right">Entry Price</TableHead>
                                                <TableHead>Exit Time</TableHead>
                                                <TableHead className="text-right">Exit Price</TableHead>
                                                <TableHead>Reason</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.trades.length > 0 ? (
                                                results.trades.map((trade, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className={`font-medium ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                                            {trade.type.toUpperCase()}
                                                        </TableCell>
                                                        <TableCell>{formatDateTime(trade.entry_timestamp)}</TableCell>
                                                        <TableCell className="text-right">{formatPrice(trade.entry_price)}</TableCell>
                                                        <TableCell>{trade.exit_timestamp ? formatDateTime(trade.exit_timestamp) : '-'}</TableCell>
                                                        <TableCell className="text-right">{trade.exit_price !== null ? formatPrice(trade.exit_price) : '-'}</TableCell>
                                                         <TableCell>{trade.reason}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                        No trades executed for this backtest.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    {/* Equity Curve Chart Section */}
                                    <h3 className="text-lg font-medium">Equity Curve</h3>
                                    <div id="equity-chart">
                                        <Chart
                                            options={chartOptions}
                                            series={chartSeries}
                                            type="line"
                                            height={350}
                                        />
                                    </div>
                                </div>
                            )}
                            {!isLoading && !results && !error && (
                                <div className="flex flex-1 items-center justify-center h-40 border border-dashed rounded-lg">
                                    <p className="text-muted-foreground">
                                        Configure and run a backtest to view results.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

// Helper component for displaying metrics
const MetricItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex flex-col space-y-1">
        <Label className="text-muted-foreground">{label}</Label>
        <p className="font-semibold">{value}</p>
    </div>
);

// Formatting helpers
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatPrice = (value: number) => {
    return value.toFixed(5);
};

const formatDateTime = (isoString: string) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (e) {
        console.error('Error formatting date:', e);
        return isoString; // Fallback
    }
};
