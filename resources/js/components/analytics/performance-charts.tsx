import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Download, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// Import ApexCharts with a lazy-loading approach for client-side only
import { lazy, Suspense } from 'react';
const ReactApexChart = lazy(() => import('react-apexcharts'));

// Define the data structure for performance analytics
export interface PerformanceData {
  // Daily P&L data
  dailyPnL: {
    dates: string[];
    values: number[];
  };
  // Cumulative P&L data
  cumulativePnL: {
    dates: string[];
    values: number[];
  };
  // Win/Loss ratio data
  winLossRatio: {
    labels: string[];
    values: number[];
  };
  // Trade volume data
  tradeVolume: {
    dates: string[];
    values: number[];
  };
  // Asset performance data
  assetPerformance: {
    assets: string[];
    performance: number[];
  };
  // Performance metrics
  metrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    avgTradeDuration: number;
    profitFactor: number;
    expectancy: number;
    avgWinningTrade: number;
    avgLosingTrade: number;
  };
  // Market benchmarks for comparison (optional)
  benchmarks?: {
    spx?: {
      dates: string[];
      values: number[];
    };
    dxy?: {
      dates: string[];
      values: number[];
    };
  };
}

interface PerformanceChartsProps {
  data: PerformanceData;
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  
  // Get theme from system/user preference
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Detect dark mode by checking the document element's class
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Check on initial load
    checkDarkMode();
    
    // Set up a MutationObserver to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Function to filter data based on selected time range
  const filterDataByTimeRange = (dates: string[], values: number[]) => {
    if (timeRange === 'ALL') return { dates, values };
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '1W':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return { dates, values };
    }
    
    const cutoffTimestamp = cutoffDate.getTime();
    const filteredData = dates.reduce<{ dates: string[], values: number[] }>(
      (acc, date, index) => {
        if (new Date(date).getTime() >= cutoffTimestamp) {
          acc.dates.push(date);
          acc.values.push(values[index]);
        }
        return acc;
      },
      { dates: [], values: [] }
    );
    
    return filteredData;
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (typeof window === 'undefined') return;
    
    // Determine which data to export based on active tab
    const activeTab = document.querySelector('[role="tabpanel"][data-state="active"]')?.getAttribute('data-value');
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    let fileName = 'performance_data.csv';
    
    // Prepare variables outside case blocks to avoid lexical declaration errors
    let dateValuePairs: string[] = [];
    let allDates: Set<string>;
    let sortedDates: string[];
    let dailyMap: Map<string, number>;
    let cumulativeMap: Map<string, number>;
    let volumeMap: Map<string, number>;
    
    switch (activeTab) {
      case 'daily':
        csvContent = 'data:text/csv;charset=utf-8,Date,Daily P&L\n';
        dateValuePairs = filteredDailyPnL.dates.map((date, i) => 
          `${date},${filteredDailyPnL.values[i]}`
        );
        csvContent += dateValuePairs.join('\n');
        fileName = 'daily_pnl.csv';
        break;
      case 'cumulative':
        csvContent = 'data:text/csv;charset=utf-8,Date,Cumulative P&L\n';
        dateValuePairs = filteredCumulativePnL.dates.map((date, i) => 
          `${date},${filteredCumulativePnL.values[i]}`
        );
        csvContent += dateValuePairs.join('\n');
        fileName = 'cumulative_pnl.csv';
        break;
      case 'winloss':
        csvContent = 'data:text/csv;charset=utf-8,Type,Count\n';
        dateValuePairs = data.winLossRatio.labels.map((label, i) => 
          `${label},${data.winLossRatio.values[i]}`
        );
        csvContent += dateValuePairs.join('\n');
        fileName = 'win_loss_ratio.csv';
        break;
      case 'volume':
        csvContent = 'data:text/csv;charset=utf-8,Date,Trade Count\n';
        dateValuePairs = filteredTradeVolume.dates.map((date, i) => 
          `${date},${filteredTradeVolume.values[i]}`
        );
        csvContent += dateValuePairs.join('\n');
        fileName = 'trade_volume.csv';
        break;
      case 'assets':
        csvContent = 'data:text/csv;charset=utf-8,Asset,Performance\n';
        dateValuePairs = data.assetPerformance.assets.map((asset, i) => 
          `${asset},${data.assetPerformance.performance[i]}`
        );
        csvContent += dateValuePairs.join('\n');
        fileName = 'asset_performance.csv';
        break;
      default:
        // Export all data if no tab is active
        csvContent = 'data:text/csv;charset=utf-8,Date,Daily P&L,Cumulative P&L,Trade Volume\n';
        
        // Create a map of all dates
        allDates = new Set([
          ...filteredDailyPnL.dates,
          ...filteredCumulativePnL.dates,
          ...filteredTradeVolume.dates
        ]);
        
        // Sort dates
        sortedDates = Array.from(allDates).sort();
        
        // Create a map for each data series
        dailyMap = new Map(filteredDailyPnL.dates.map((date, i) => [date, filteredDailyPnL.values[i]]));
        cumulativeMap = new Map(filteredCumulativePnL.dates.map((date, i) => [date, filteredCumulativePnL.values[i]]));
        volumeMap = new Map(filteredTradeVolume.dates.map((date, i) => [date, filteredTradeVolume.values[i]]));
        
        // Create CSV rows
        csvContent += sortedDates.map(date => 
          `${date},${dailyMap.get(date) || ''},${cumulativeMap.get(date) || ''},${volumeMap.get(date) || ''}`
        ).join('\n');
        
        fileName = 'all_performance_data.csv';
    }
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Daily P&L Chart
  const filteredDailyPnL = filterDataByTimeRange(data.dailyPnL.dates, data.dailyPnL.values);
  const dailyPnLOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
      },
      fontFamily: 'inherit',
      background: isDarkMode ? 'transparent' : '#F9F9F9',
    },
    plotOptions: {
      bar: {
        colors: {
          ranges: [
            {
              from: -1000000,
              to: 0,
              color: '#D04014', // Red for losses (from your brand colors)
            },
            {
              from: 0,
              to: 1000000,
              color: '#8D5EB7', // Purple for gains (from your brand colors)
            },
          ],
        },
        columnWidth: '80%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      title: {
        text: 'Profit/Loss',
      },
      labels: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        },
      },
    },
    xaxis: {
      type: 'datetime',
      categories: filteredDailyPnL.dates,
      labels: {
        rotate: -45,
        rotateAlways: false,
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
        },
      },
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    colors: ['#8D5EB7'], // Purple from your brand colors
  };
  
  // Cumulative P&L Chart
  const filteredCumulativePnL = filterDataByTimeRange(data.cumulativePnL.dates, data.cumulativePnL.values);
  
  // Prepare benchmark data if available and enabled
  const benchmarkSeries: Array<{
    name: string;
    data: number[];
    type: string;
    color: string;
  }> = [];
  if (showBenchmarks && data.benchmarks) {
    if (data.benchmarks.spx) {
      const filteredSpx = filterDataByTimeRange(
        data.benchmarks.spx.dates,
        data.benchmarks.spx.values
      );
      benchmarkSeries.push({
        name: 'S&P 500',
        data: filteredSpx.values,
        type: 'line',
        color: '#211DE4', // Blue from your brand colors
      });
    }
    
    if (data.benchmarks.dxy) {
      const filteredDxy = filterDataByTimeRange(
        data.benchmarks.dxy.dates,
        data.benchmarks.dxy.values
      );
      benchmarkSeries.push({
        name: 'DXY (Dollar Index)',
        data: filteredDxy.values,
        type: 'line',
        color: '#EECEE6', // Pink from your brand colors
      });
    }
  }
  
  const cumulativePnLOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
      },
      fontFamily: 'inherit',
      background: isDarkMode ? 'transparent' : '#F9F9F9',
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      title: {
        text: 'Cumulative P&L',
      },
      labels: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        },
      },
    },
    xaxis: {
      type: 'datetime',
      categories: filteredCumulativePnL.dates,
      labels: {
        rotate: -45,
        rotateAlways: false,
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
        },
      },
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    colors: ['#8D5EB7'], // Purple from your brand colors
  };
  
  // Win/Loss Ratio Chart (Pie)
  const winLossOptions = {
    chart: {
      type: 'pie',
      height: 350,
      fontFamily: 'inherit',
      background: isDarkMode ? 'transparent' : '#F9F9F9',
    },
    labels: data.winLossRatio.labels,
    colors: ['#8D5EB7', '#D04014'], // Purple for wins, Red for losses (from your brand colors)
    legend: {
      position: 'bottom',
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
    tooltip: {
      y: {
        formatter: (value: number) => {
          return `${value} trades`;
        },
      },
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  };
  
  // Trade Volume Chart
  const filteredTradeVolume = filterDataByTimeRange(data.tradeVolume.dates, data.tradeVolume.values);
  const tradeVolumeOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
      },
      fontFamily: 'inherit',
      background: isDarkMode ? 'transparent' : '#F9F9F9',
    },
    plotOptions: {
      bar: {
        columnWidth: '80%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      title: {
        text: 'Number of Trades',
      },
    },
    xaxis: {
      type: 'datetime',
      categories: filteredTradeVolume.dates,
      labels: {
        rotate: -45,
        rotateAlways: false,
      },
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    colors: ['#211DE4'], // Blue from your brand colors
  };
  
  // Asset Performance Chart (Horizontal Bar)
  const assetPerformanceOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
      },
      fontFamily: 'inherit',
      background: isDarkMode ? 'transparent' : '#F9F9F9',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        distributed: true,
        colors: {
          ranges: [
            {
              from: -1000000,
              to: 0,
              color: '#D04014', // Red for losses
            },
            {
              from: 0,
              to: 1000000,
              color: '#8D5EB7', // Purple for gains
            },
          ],
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: data.assetPerformance.assets,
      labels: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        },
      },
    },
    yaxis: {
      title: {
        text: 'Asset',
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
        },
      },
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  };

  // Calculate win rate
  const winRate = data.winLossRatio.values[0] > 0
    ? (data.winLossRatio.values[0] / 
       data.winLossRatio.values.reduce((a, b) => a + b, 0)) * 100
    : 0;
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Theme colors for charts
  const chartColors = {
    background: isDarkMode ? 'transparent' : '#F9F9F9',
    text: isDarkMode ? '#888888' : '#1A161D',
    grid: isDarkMode ? '#333333' : '#e5e5e5',
    series: ['#8D5EB7', '#211DE49', '#EECEE6', '#D04014'] // Brand colors
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Performance Analytics</CardTitle>
        <div className="flex items-center space-x-4">
          {/* Benchmark toggle */}
          {data.benchmarks && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-benchmarks" className="text-sm">Benchmarks</Label>
              <Switch
                id="show-benchmarks"
                checked={showBenchmarks}
                onCheckedChange={setShowBenchmarks}
              />
            </div>
          )}
          
          {/* Time range selector */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="time-range" className="text-sm">Time Range:</Label>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger id="time-range" className="w-[120px]">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1W">1 Week</SelectItem>
                <SelectItem value="1M">1 Month</SelectItem>
                <SelectItem value="3M">3 Months</SelectItem>
                <SelectItem value="6M">6 Months</SelectItem>
                <SelectItem value="1Y">1 Year</SelectItem>
                <SelectItem value="ALL">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Performance Metrics */}
        {data.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {data.metrics.sharpeRatio !== undefined && (
              <div className="bg-card border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="text-sm font-medium">Sharpe Ratio</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Measures risk-adjusted return. Higher is better.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xl font-bold">{data.metrics.sharpeRatio.toFixed(2)}</p>
              </div>
            )}
            
            {data.metrics.maxDrawdown !== undefined && (
              <div className="bg-card border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="text-sm font-medium">Max Drawdown</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Maximum loss from peak to trough. Lower is better.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xl font-bold text-red-500">
                  {data.metrics.maxDrawdown.toFixed(2)}%
                </p>
              </div>
            )}
            
            {data.metrics.avgWinningTrade !== undefined && (
              <div className="bg-card border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="text-sm font-medium">Avg Win</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Average profit on winning trades.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xl font-bold text-green-500">
                  {formatCurrency(data.metrics.avgWinningTrade)}
                </p>
              </div>
            )}
            
            {data.metrics.avgLosingTrade !== undefined && (
              <div className="bg-card border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="text-sm font-medium">Avg Loss</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Average loss on losing trades.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xl font-bold text-red-500">
                  {formatCurrency(data.metrics.avgLosingTrade)}
                </p>
              </div>
            )}
            
            {data.metrics.profitFactor !== undefined && (
              <div className="bg-card border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="text-sm font-medium">Profit Factor</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Ratio of gross profit to gross loss. Higher is better.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xl font-bold">{data.metrics.profitFactor.toFixed(2)}</p>
              </div>
            )}
            
            {winRate !== undefined && (
              <div className="bg-card border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="text-sm font-medium">Win Rate</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Percentage of winning trades.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xl font-bold">{winRate.toFixed(2)}%</p>
              </div>
            )}
          </div>
        )}
        
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="daily">Daily P&L</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative P&L</TabsTrigger>
            <TabsTrigger value="winloss">Win/Loss Ratio</TabsTrigger>
            <TabsTrigger value="volume">Trade Volume</TabsTrigger>
            <TabsTrigger value="assets">Asset Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-4">
            <div className="h-[400px] w-full">
              <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>}>
                {typeof window !== 'undefined' && (
                  <ReactApexChart
                    options={dailyPnLOptions}
                    series={[{ name: 'Daily P&L', data: filteredDailyPnL.values }]}
                    type="bar"
                    height={400}
                  />
                )}
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="cumulative" className="mt-4">
            <div className="h-[400px] w-full">
              <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>}>
                {typeof window !== 'undefined' && (
                  <ReactApexChart
                    options={cumulativePnLOptions}
                    series={[
                      { name: 'Your P&L', data: filteredCumulativePnL.values },
                      ...benchmarkSeries
                    ]}
                    type="area"
                    height={400}
                  />
                )}
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="winloss" className="mt-4">
            <div className="h-[400px] w-full">
              <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>}>
                {typeof window !== 'undefined' && (
                  <ReactApexChart
                    options={winLossOptions}
                    series={data.winLossRatio.values}
                    type="pie"
                    height={400}
                  />
                )}
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="volume" className="mt-4">
            <div className="h-[400px] w-full">
              <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>}>
                {typeof window !== 'undefined' && (
                  <ReactApexChart
                    options={tradeVolumeOptions}
                    series={[{ name: 'Trade Volume', data: filteredTradeVolume.values }]}
                    type="bar"
                    height={400}
                  />
                )}
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="assets" className="mt-4">
            <div className="h-[400px] w-full">
              <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>}>
                {typeof window !== 'undefined' && (
                  <ReactApexChart
                    options={assetPerformanceOptions}
                    series={[{ name: 'Performance', data: data.assetPerformance.performance }]}
                    type="bar"
                    height={400}
                  />
                )}
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceCharts;
