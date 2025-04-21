import React from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, TrendingDown, BarChart3, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme-provider';

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
    drawdownHistory?: { date: string; percentage: number }[];
  };
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ riskMetrics }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
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

  const renderDrawdownChart = () => {
    if (!riskMetrics.drawdownHistory || riskMetrics.drawdownHistory.length === 0) {
      return <p className="text-center text-muted-foreground h-full flex items-center justify-center">No drawdown history data available.</p>;
    }

    const series = [{
      name: 'Drawdown',
      data: riskMetrics.drawdownHistory.map(item => ({ 
        x: new Date(item.date).getTime(), 
        y: item.percentage 
      }))
    }];

    const options: ApexOptions = {
      chart: {
        type: 'area',
        height: 350,
        background: 'transparent',
        toolbar: {
          show: true,
          tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
        },
         animations: {
             enabled: false
         },
         zoom: {
             enabled: true
         }
      },
      theme: {
        mode: isDarkMode ? 'dark' : 'light',
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: ['#D04014'] 
      },
      fill: { 
        type: 'gradient',
        colors: ['#D04014'],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.6,
          opacityTo: 0.1,
          stops: [0, 90, 100]
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
             enabled: true
         }
      },
      yaxis: {
        labels: {
          formatter: function (value) {
            return `${value.toFixed(1)}%`; 
          },
          style: {
              colors: isDarkMode ? '#E1E1E6' : '#333333'
          }
        },
        min: 0, 
        title: {
             text: 'Drawdown Percentage',
             style: {
                 color: isDarkMode ? '#E1E1E6' : '#333333',
                 fontWeight: 400,
             }
        }
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: function (value) {
            return `${value.toFixed(2)}%`;
          },
          title: {
            formatter: () => 'Drawdown:'
          }
        }
      },
      grid: {
        borderColor: isDarkMode ? '#333' : '#e0e0e0',
        strokeDashArray: 4,
      },
      title: {
        text: 'Drawdown Over Time',
        align: 'left',
         style: {
             color: isDarkMode ? '#F9F9F9' : '#1A161D',
         }
      }
    };

    return <Chart options={options} series={series} type="area" height={350} />;
  };

  const renderVaRChart = () => {
    // Check if VaR data exists
    if (!riskMetrics.valueAtRisk) {
       return <p className="text-center text-muted-foreground h-full flex items-center justify-center">Value at Risk data not available.</p>;
    }

    const { daily95, daily99, weekly95 } = riskMetrics.valueAtRisk;

    // Prepare data for ApexCharts Bar chart
    const series = [{
      name: 'VaR Amount',
      data: [daily95, daily99, weekly95]
    }];

    const options: ApexOptions = {
      chart: {
        type: 'bar',
        height: 350,
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      theme: {
        mode: isDarkMode ? 'dark' : 'light',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5, // Use borderRadius instead
          distributed: false, // Use single color for all bars
        },
      },
      dataLabels: {
        enabled: false, // Keep bars clean, tooltip shows value
      },
       colors: ['#8D5EB7'], // Use primary brand color for VaR bars
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Daily 95%', 'Daily 99%', 'Weekly 95%'],
        labels: {
          style: {
              colors: isDarkMode ? '#E1E1E6' : '#333333'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Potential Loss Amount (USD)',
           style: {
                 color: isDarkMode ? '#E1E1E6' : '#333333',
                 fontWeight: 400,
           }
        },
        labels: {
          formatter: function (value) {
             return formatCurrency(value); // Use existing currency formatter
          },
          style: {
              colors: isDarkMode ? '#E1E1E6' : '#333333'
          }
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        y: {
          formatter: function (val) {
            return formatCurrency(val) + " maximum potential loss";
          },
          title: {
             formatter: (seriesName, opts) => {
                 const category = opts.w.globals.labels[opts.dataPointIndex];
                 return `${category} VaR:`;
             }
          }
        }
      },
       grid: {
        borderColor: isDarkMode ? '#333' : '#e0e0e0',
        strokeDashArray: 4,
      },
      title: {
        text: 'Value at Risk (VaR) Comparison',
        align: 'left',
        style: {
             color: isDarkMode ? '#F9F9F9' : '#1A161D',
         }
      }
    };

    return <Chart options={options} series={series} type="bar" height={350} />;
  };

  const renderRatiosChart = () => {
    // Check if ratio data exists
    if (riskMetrics.sharpeRatio === undefined || riskMetrics.sortinoRatio === undefined) {
       return <p className="text-center text-muted-foreground h-full flex items-center justify-center">Ratio data not available.</p>;
    }
    
    const series = [{
        name: 'Ratio Value',
        data: [riskMetrics.sharpeRatio, riskMetrics.sortinoRatio]
    }];

    const options: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            toolbar: {
                show: false
            }
        },
        theme: {
            mode: isDarkMode ? 'dark' : 'light',
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '45%',
                distributed: true, // Use different colors for each bar
                borderRadius: 5,
            },
        },
         colors: ['#8D5EB7', '#EECEE6'], // Sharpe (Purple), Sortino (Pink-ish)
        dataLabels: {
            enabled: false,
        },
        xaxis: {
            categories: ['Sharpe Ratio', 'Sortino Ratio'],
            labels: {
                style: {
                    colors: isDarkMode ? '#E1E1E6' : '#333333',
                    fontWeight: 600,
                }
            }
        },
        yaxis: {
            title: {
                text: 'Ratio Value',
                 style: {
                     color: isDarkMode ? '#E1E1E6' : '#333333',
                     fontWeight: 400,
                }
            },
            labels: {
                formatter: function (value) {
                    return value.toFixed(2); // Format ratio to 2 decimal places
                },
                style: {
                    colors: isDarkMode ? '#E1E1E6' : '#333333'
                }
            }
        },
        tooltip: {
            theme: isDarkMode ? 'dark' : 'light',
            y: {
                formatter: function (val) {
                    return val.toFixed(3); // Show more precision in tooltip
                },
                 title: {
                    formatter: (seriesName, opts) => {
                        return opts.w.globals.labels[opts.dataPointIndex] + ':';
                    }
                }
            }
        },
        legend: {
            show: false // Colors are tied to categories directly
        },
        grid: {
            borderColor: isDarkMode ? '#333' : '#e0e0e0',
            strokeDashArray: 4,
        },
        title: {
            text: 'Risk-Adjusted Return Ratios',
            align: 'left',
            style: {
                color: isDarkMode ? '#F9F9F9' : '#1A161D',
            }
        }
    };

    return <Chart options={options} series={series} type="bar" height={350} />;
  };

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
                {renderDrawdownChart()}
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
                {renderVaRChart()}
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
                {renderRatiosChart()}
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
