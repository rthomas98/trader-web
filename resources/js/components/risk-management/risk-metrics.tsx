import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, TrendingDown, BarChart3, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import ApexCharts with a lazy-loading approach for client-side only
import { lazy, Suspense } from 'react';
const ReactApexChart = lazy(() => import('react-apexcharts'));

interface RiskMetricsProps {
  riskMetrics: {
    maxDrawdown: {
      value: number;
      percentage: number;
      startDate: string | null;
      endDate: string | null;
      recoveryDate: string | null;
      duration: number;
    };
    sharpeRatio: number;
    sortinoRatio: number;
    valueAtRisk: {
      daily95: number;
      daily99: number;
      weekly95: number;
    };
  };
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ riskMetrics }) => {
  const [activeTab, setActiveTab] = React.useState('drawdown');

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  // Format percentage
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0.00%';
    }
    return `${Number(value).toFixed(2)}%`;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Generate data for the drawdown chart
  const generateDrawdownChartData = () => {
    // Create sample drawdown data
    const dates = [];
    const drawdownValues = [];
    
    if (riskMetrics.maxDrawdown.startDate && riskMetrics.maxDrawdown.endDate) {
      const startDate = new Date(riskMetrics.maxDrawdown.startDate);
      const endDate = new Date(riskMetrics.maxDrawdown.endDate);
      const recoveryDate = riskMetrics.maxDrawdown.recoveryDate 
        ? new Date(riskMetrics.maxDrawdown.recoveryDate)
        : new Date(endDate.getTime() + 86400000 * 30); // Add 30 days if no recovery
      
      // Generate dates between start and recovery
      let currentDate = new Date(startDate);
      while (currentDate <= recoveryDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate = new Date(currentDate.getTime() + 86400000); // Add 1 day
      }
      
      // Generate drawdown values
      const maxDrawdownValue = riskMetrics.maxDrawdown.value;
      const drawdownDuration = Math.max(1, (endDate.getTime() - startDate.getTime()) / 86400000);
      const recoveryDuration = Math.max(1, (recoveryDate.getTime() - endDate.getTime()) / 86400000);
      
      dates.forEach((date) => {
        const dateObj = new Date(date);
        if (dateObj < endDate) {
          // Drawdown phase - linear decline to max drawdown
          const daysFromStart = (dateObj.getTime() - startDate.getTime()) / 86400000;
          const drawdownPercentage = (daysFromStart / drawdownDuration) * 100;
          drawdownValues.push(-(maxDrawdownValue * drawdownPercentage / 100));
        } else {
          // Recovery phase - linear recovery
          const daysFromBottom = (dateObj.getTime() - endDate.getTime()) / 86400000;
          const recoveryPercentage = (daysFromBottom / recoveryDuration) * 100;
          drawdownValues.push(-(maxDrawdownValue * (1 - Math.min(1, recoveryPercentage / 100))));
        }
      });
    } else {
      // If no real drawdown data, create sample data
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - 30 + i);
        dates.push(date.toISOString().split('T')[0]);
        
        // Create a sample drawdown curve
        if (i < 10) {
          drawdownValues.push(-(i * 50)); // Decline phase
        } else if (i < 20) {
          drawdownValues.push(-500 + ((i - 10) * 25)); // Recovery phase 1
        } else {
          drawdownValues.push(-250 + ((i - 20) * 25)); // Recovery phase 2
        }
      }
    }
    
    return {
      series: [{
        name: 'Drawdown',
        data: drawdownValues,
      }],
      options: {
        chart: {
          type: 'area',
          height: 350,
          toolbar: {
            show: true,
          },
          background: 'transparent',
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: 'smooth',
          width: 2,
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100],
            colorStops: [
              {
                offset: 0,
                color: '#D04014',
                opacity: 0.4
              },
              {
                offset: 100,
                color: '#8D5EB7',
                opacity: 0.2
              },
            ]
          },
        },
        colors: ['#D04014'],
        xaxis: {
          categories: dates,
          type: 'datetime',
          labels: {
            formatter: function(value: string) {
              return new Date(value).toLocaleDateString();
            },
          },
          title: {
            text: 'Date',
            style: {
              fontFamily: 'inherit',
            },
          },
        },
        yaxis: {
          title: {
            text: 'Drawdown Amount',
            style: {
              fontFamily: 'inherit',
            },
          },
          labels: {
            formatter: function(value: number) {
              return formatCurrency(Math.abs(value));
            },
          },
        },
        tooltip: {
          shared: false,
          intersect: true,
          y: {
            formatter: function(value: number) {
              return formatCurrency(Math.abs(value));
            },
          },
        },
        title: {
          text: 'Maximum Drawdown Analysis',
          align: 'center',
          style: {
            fontFamily: 'inherit',
          },
        },
        theme: {
          mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        },
      },
    };
  };

  // Generate data for the VaR chart
  const generateVaRChartData = () => {
    const varValues = [
      riskMetrics.valueAtRisk.daily95,
      riskMetrics.valueAtRisk.daily99,
      riskMetrics.valueAtRisk.weekly95,
    ];
    
    return {
      series: [{
        name: 'Value at Risk',
        data: varValues,
      }],
      options: {
        chart: {
          type: 'bar',
          height: 350,
          toolbar: {
            show: false,
          },
          background: 'transparent',
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            horizontal: true,
            dataLabels: {
              position: 'top',
            },
          },
        },
        colors: ['#8D5EB7'],
        dataLabels: {
          enabled: true,
          formatter: function(val: number) {
            return formatCurrency(val);
          },
          offsetX: 30,
          style: {
            fontSize: '12px',
            colors: ['#304758'],
          },
        },
        xaxis: {
          categories: ['Daily (95% CI)', 'Daily (99% CI)', 'Weekly (95% CI)'],
          title: {
            text: 'Value at Risk',
            style: {
              fontFamily: 'inherit',
            },
          },
          labels: {
            formatter: function(value: string) {
              return formatCurrency(Number(value));
            },
          },
        },
        yaxis: {
          title: {
            text: 'Time Period',
            style: {
              fontFamily: 'inherit',
            },
          },
        },
        title: {
          text: 'Value at Risk (VaR)',
          align: 'center',
          style: {
            fontFamily: 'inherit',
          },
        },
        tooltip: {
          shared: false,
          intersect: true,
          y: {
            formatter: function(value: number) {
              return formatCurrency(value);
            },
          },
        },
        theme: {
          mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        },
      },
    };
  };

  // Generate data for the ratios chart
  const generateRatiosChartData = () => {
    return {
      series: [{
        name: 'Ratio Value',
        data: [riskMetrics.sharpeRatio, riskMetrics.sortinoRatio],
      }],
      options: {
        chart: {
          type: 'bar',
          height: 350,
          toolbar: {
            show: false,
          },
          background: 'transparent',
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '50%',
            dataLabels: {
              position: 'top',
            },
            colors: {
              ranges: [
                {
                  from: -10,
                  to: 0,
                  color: '#D04014',
                },
                {
                  from: 0,
                  to: 1,
                  color: '#EECEE6',
                },
                {
                  from: 1,
                  to: 10,
                  color: '#8D5EB7',
                },
              ],
            },
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function(val: number) {
            return val.toFixed(2);
          },
          offsetY: -20,
          style: {
            fontSize: '12px',
            colors: ['#304758'],
          },
        },
        xaxis: {
          categories: ['Sharpe Ratio', 'Sortino Ratio'],
          position: 'bottom',
          title: {
            text: 'Risk-Adjusted Return Metrics',
            style: {
              fontFamily: 'inherit',
            },
          },
        },
        yaxis: {
          title: {
            text: 'Ratio Value',
            style: {
              fontFamily: 'inherit',
            },
          },
          labels: {
            formatter: function(val: number) {
              return val.toFixed(2);
            },
          },
        },
        title: {
          text: 'Risk-Adjusted Return Ratios',
          align: 'center',
          style: {
            fontFamily: 'inherit',
          },
        },
        theme: {
          mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        },
      },
    };
  };

  const drawdownChartData = generateDrawdownChartData();
  const varChartData = generateVaRChartData();
  const ratiosChartData = generateRatiosChartData();

  // Get rating for Sharpe ratio
  const getSharpeRating = (value: number) => {
    if (value >= 3) return { text: 'Excellent', color: 'text-green-500' };
    if (value >= 2) return { text: 'Good', color: 'text-blue-500' };
    if (value >= 1) return { text: 'Average', color: 'text-yellow-500' };
    if (value >= 0) return { text: 'Poor', color: 'text-orange-500' };
    return { text: 'Very Poor', color: 'text-red-500' };
  };

  // Get rating for Sortino ratio
  const getSortinoRating = (value: number) => {
    if (value >= 2) return { text: 'Excellent', color: 'text-green-500' };
    if (value >= 1.5) return { text: 'Good', color: 'text-blue-500' };
    if (value >= 1) return { text: 'Average', color: 'text-yellow-500' };
    if (value >= 0) return { text: 'Poor', color: 'text-orange-500' };
    return { text: 'Very Poor', color: 'text-red-500' };
  };

  // Get rating for max drawdown
  const getDrawdownRating = (value: number) => {
    if (value <= 5) return { text: 'Excellent', color: 'text-green-500' };
    if (value <= 10) return { text: 'Good', color: 'text-blue-500' };
    if (value <= 20) return { text: 'Average', color: 'text-yellow-500' };
    if (value <= 30) return { text: 'Poor', color: 'text-orange-500' };
    return { text: 'Very Poor', color: 'text-red-500' };
  };

  const sharpeRating = getSharpeRating(riskMetrics.sharpeRatio);
  const sortinoRating = getSortinoRating(riskMetrics.sortinoRatio);
  const drawdownRating = getDrawdownRating(riskMetrics.maxDrawdown.percentage);

  return (
    <div className="space-y-6">
      {/* Risk Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Sharpe Ratio</h3>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Measures risk-adjusted return. Higher is better. Values above 1 are generally considered acceptable.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="text-3xl font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</div>
            <div className={`text-sm font-medium mt-1 ${sharpeRating.color}`}>{sharpeRating.text}</div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Sharpe Ratio = (Return - Risk Free Rate) / Standard Deviation</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Sortino Ratio</h3>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Similar to Sharpe ratio but only considers downside risk. Higher is better.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="text-3xl font-bold">{riskMetrics.sortinoRatio.toFixed(2)}</div>
            <div className={`text-sm font-medium mt-1 ${sortinoRating.color}`}>{sortinoRating.text}</div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Sortino Ratio = (Return - Risk Free Rate) / Downside Deviation</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingDown className="mr-2 h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Max Drawdown</h3>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The largest peak-to-trough decline in your account value. Lower is better.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="text-3xl font-bold">{formatPercentage(riskMetrics.maxDrawdown.percentage)}</div>
            <div className={`text-sm font-medium mt-1 ${drawdownRating.color}`}>{drawdownRating.text}</div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Duration: {riskMetrics.maxDrawdown.duration} days</p>
              {riskMetrics.maxDrawdown.startDate && (
                <p>Period: {formatDate(riskMetrics.maxDrawdown.startDate)} to {formatDate(riskMetrics.maxDrawdown.endDate)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Value at Risk Summary */}
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Value at Risk (VaR)</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">The maximum expected loss over a specific time period at a given confidence level.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Daily (95% CI)</div>
              <div className="text-2xl font-bold">{formatCurrency(riskMetrics.valueAtRisk.daily95)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                95% confidence you won't lose more than this in a day
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Daily (99% CI)</div>
              <div className="text-2xl font-bold">{formatCurrency(riskMetrics.valueAtRisk.daily99)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                99% confidence you won't lose more than this in a day
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Weekly (95% CI)</div>
              <div className="text-2xl font-bold">{formatCurrency(riskMetrics.valueAtRisk.weekly95)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                95% confidence you won't lose more than this in a week
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="drawdown">
            <TrendingDown className="mr-2 h-4 w-4" />
            Drawdown Analysis
          </TabsTrigger>
          <TabsTrigger value="var">
            <BarChart3 className="mr-2 h-4 w-4" />
            Value at Risk
          </TabsTrigger>
          <TabsTrigger value="ratios">
            <TrendingUp className="mr-2 h-4 w-4" />
            Risk Ratios
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="drawdown" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                  <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                </div>}>
                  {typeof window !== 'undefined' && (
                    <ReactApexChart
                      options={drawdownChartData.options}
                      series={drawdownChartData.series}
                      type="area"
                      height={350}
                    />
                  )}
                </Suspense>
              </div>
              <div className="mt-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-md">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  <p className="font-medium">Understanding Drawdown:</p>
                  <p>
                    Maximum drawdown measures the largest peak-to-trough decline in your account value. It helps you understand the worst-case scenario you've experienced and how long it took to recover.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="var" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                  <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                </div>}>
                  {typeof window !== 'undefined' && (
                    <ReactApexChart
                      options={varChartData.options}
                      series={varChartData.series}
                      type="bar"
                      height={350}
                    />
                  )}
                </Suspense>
              </div>
              <div className="mt-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-md">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  <p className="font-medium">Understanding Value at Risk (VaR):</p>
                  <p>
                    VaR estimates the maximum potential loss over a specific time period at a given confidence level. For example, a daily VaR of $500 at 95% confidence means there's a 95% chance you won't lose more than $500 in a single day.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ratios" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                  <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                </div>}>
                  {typeof window !== 'undefined' && (
                    <ReactApexChart
                      options={ratiosChartData.options}
                      series={ratiosChartData.series}
                      type="bar"
                      height={350}
                    />
                  )}
                </Suspense>
              </div>
              <div className="mt-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-md">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  <p className="font-medium">Understanding Risk-Adjusted Return Ratios:</p>
                  <p>
                    <strong>Sharpe Ratio:</strong> Measures excess return per unit of risk. A higher Sharpe ratio indicates better risk-adjusted performance.
                  </p>
                  <p className="mt-1">
                    <strong>Sortino Ratio:</strong> Similar to Sharpe but only considers downside risk. It's more relevant for traders who are concerned with downside volatility.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskMetrics;
