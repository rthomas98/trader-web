import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, TrendingUp, BarChart2, PieChart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

// Import ApexCharts with a lazy-loading approach for client-side only
import { lazy, Suspense } from 'react';
const ReactApexChart = lazy(() => import('react-apexcharts'));

interface RiskRewardVisualizerProps {
  positionSizing: {
    fixedRisk: Array<{
      pair: string;
      stopLossPips: number;
      maxRiskAmount: number;
      recommendedLotSize: number;
      positionSize: number;
    }>;
    percentageRisk: Array<{
      pair: string;
      riskPercentage: number;
      riskRewardRatio: number;
      potentialProfit: number;
      potentialLoss: number;
    }>;
    riskRewardRatios: {
      winRate: number;
      kellyPercentage: number;
      optimalRatio: number;
      expectedValues: Array<{
        ratio: number;
        expectedValue: number;
        isOptimal: boolean;
      }>;
    };
  };
  riskProfile: {
    riskPercentage: number;
    historicalRisk: Array<{
      date: string;
      total_loss: number;
      total_profit: number;
      trade_count: number;
    }>;
    avgRiskPerTrade: number;
    riskToleranceLevel: 'conservative' | 'moderate' | 'aggressive';
  };
}

const RiskRewardVisualizer: React.FC<RiskRewardVisualizerProps> = ({
  positionSizing,
  riskProfile,
}) => {
  const [activeTab, setActiveTab] = useState('expected-value');
  const [riskRewardRatio, setRiskRewardRatio] = useState(2);
  const [winRate, setWinRate] = useState(positionSizing.riskRewardRatios.winRate || 50);
  const [tradeAmount, setTradeAmount] = useState(1000);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate expected value based on current inputs
  const calculateExpectedValue = (r: number, w: number) => {
    // Expected value formula: (Win Rate * R) - (Loss Rate * 1)
    // Where R is the risk-reward ratio and loss rate is (1 - win rate)
    return (w / 100) * r - (1 - w / 100);
  };

  // Calculate potential outcomes
  const calculateOutcomes = () => {
    const ev = calculateExpectedValue(riskRewardRatio, winRate);
    const winAmount = tradeAmount * riskRewardRatio;
    const lossAmount = tradeAmount;
    
    return {
      expectedValue: ev,
      expectedReturn: ev * tradeAmount,
      winAmount,
      lossAmount,
      isPositiveEV: ev > 0,
    };
  };

  const outcomes = calculateOutcomes();

  // Generate data for the expected value chart
  const generateExpectedValueData = () => {
    const ratios = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
    const winRates = [30, 40, 50, 60, 70];
    
    const series = winRates.map(wr => ({
      name: `${wr}% Win Rate`,
      data: ratios.map(r => calculateExpectedValue(r, wr)),
    }));
    
    return {
      series,
      options: {
        chart: {
          type: 'line',
          height: 350,
          toolbar: {
            show: true,
          },
          background: 'transparent',
        },
        colors: ['#D04014', '#EECEE6', '#8D5EB7', '#211DE49', '#1A161D'],
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: 'smooth',
          width: 2,
        },
        grid: {
          borderColor: '#e5e5e5',
          row: {
            colors: ['transparent', 'transparent'],
            opacity: 0.5,
          },
        },
        markers: {
          size: 4,
        },
        xaxis: {
          categories: ratios,
          title: {
            text: 'Risk-Reward Ratio',
            style: {
              fontFamily: 'inherit',
            },
          },
        },
        yaxis: {
          title: {
            text: 'Expected Value',
            style: {
              fontFamily: 'inherit',
            },
          },
          labels: {
            formatter: function(value: number) {
              return value.toFixed(2);
            },
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          floating: true,
          offsetY: -25,
          offsetX: -5,
        },
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: function(value: number) {
              return value.toFixed(2);
            },
          },
        },
        theme: {
          mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        },
      },
    };
  };

  // Generate data for the Kelly criterion chart
  const generateKellyData = () => {
    const optimalRatio = positionSizing.riskRewardRatios.optimalRatio;
    const kellyPercentage = positionSizing.riskRewardRatios.kellyPercentage;
    
    return {
      series: [{
        name: 'Kelly Percentage',
        data: positionSizing.riskRewardRatios.expectedValues.map(ev => ev.ratio === optimalRatio ? kellyPercentage : kellyPercentage / 2),
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
            dataLabels: {
              position: 'top',
            },
            colors: {
              ranges: [{
                from: 0,
                to: 100,
                color: '#8D5EB7',
              }],
            },
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function(val: number) {
            return val.toFixed(1) + '%';
          },
          offsetY: -20,
          style: {
            fontSize: '12px',
            colors: ['#304758'],
          },
        },
        xaxis: {
          categories: positionSizing.riskRewardRatios.expectedValues.map(ev => ev.ratio),
          position: 'bottom',
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          title: {
            text: 'Risk-Reward Ratio',
            style: {
              fontFamily: 'inherit',
            },
          },
        },
        yaxis: {
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            show: true,
            formatter: function(val: number) {
              return val.toFixed(0) + '%';
            },
          },
          title: {
            text: 'Kelly Percentage',
            style: {
              fontFamily: 'inherit',
            },
          },
        },
        title: {
          text: 'Optimal Bet Size (Kelly Criterion)',
          floating: false,
          offsetY: 0,
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

  // Generate data for the risk-reward simulator
  const generateSimulatorData = () => {
    // Create data for 100 simulated trades
    const trades = [];
    const equity = [tradeAmount * 10]; // Start with 10x the trade amount
    
    for (let i = 0; i < 100; i++) {
      const isWin = Math.random() * 100 < winRate;
      const tradeResult = isWin ? tradeAmount * riskRewardRatio : -tradeAmount;
      trades.push(tradeResult);
      
      const newEquity = equity[equity.length - 1] + tradeResult;
      equity.push(newEquity);
    }
    
    return {
      series: [{
        name: 'Account Equity',
        data: equity,
      }],
      options: {
        chart: {
          type: 'line',
          height: 350,
          toolbar: {
            show: true,
          },
          background: 'transparent',
        },
        colors: ['#8D5EB7'],
        stroke: {
          curve: 'stepline',
          width: 2,
        },
        dataLabels: {
          enabled: false,
        },
        markers: {
          size: 0,
        },
        xaxis: {
          categories: Array.from({ length: equity.length }, (_, i) => i),
          title: {
            text: 'Trade Number',
            style: {
              fontFamily: 'inherit',
            },
          },
        },
        yaxis: {
          title: {
            text: 'Account Equity',
            style: {
              fontFamily: 'inherit',
            },
          },
          labels: {
            formatter: function(value: number) {
              return formatCurrency(value);
            },
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
        title: {
          text: 'Monte Carlo Simulation (100 Trades)',
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

  const expectedValueData = generateExpectedValueData();
  const kellyData = generateKellyData();
  const simulatorData = generateSimulatorData();

  return (
    <div className="space-y-6">
      {/* Risk-Reward Calculator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-card">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Risk-Reward Calculator</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Label htmlFor="riskRewardRatio" className="mr-2">Risk-Reward Ratio</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The ratio of your potential reward to your risk. E.g., 2:1 means your potential profit is twice your potential loss.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-sm text-muted-foreground">{riskRewardRatio}:1</span>
                  </div>
                  <Slider
                    value={[riskRewardRatio]}
                    onValueChange={(value) => setRiskRewardRatio(value[0])}
                    min={0.5}
                    max={5}
                    step={0.1}
                    className="py-4"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Label htmlFor="winRate" className="mr-2">Win Rate</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The percentage of trades that are profitable.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-sm text-muted-foreground">{winRate}%</span>
                  </div>
                  <Slider
                    value={[winRate]}
                    onValueChange={(value) => setWinRate(value[0])}
                    min={10}
                    max={90}
                    step={1}
                    className="py-4"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="tradeAmount" className="mr-2">Risk Amount</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The amount you're risking on this trade.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="tradeAmount"
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(Number(e.target.value))}
                    min={1}
                    step={100}
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Expected Outcome</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-3 rounded-md">
                      <div className="text-xs text-muted-foreground">Win Amount</div>
                      <div className="text-lg font-bold text-green-500">{formatCurrency(outcomes.winAmount)}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="text-xs text-muted-foreground">Loss Amount</div>
                      <div className="text-lg font-bold text-red-500">-{formatCurrency(outcomes.lossAmount)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm text-muted-foreground">Expected Value</div>
                    <Badge variant={outcomes.isPositiveEV ? "success" : "destructive"}>
                      {outcomes.isPositiveEV ? "Positive EV" : "Negative EV"}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {outcomes.expectedValue.toFixed(2)}
                  </div>
                  <div className="text-sm mt-1">
                    Expected Return: <span className={outcomes.expectedReturn >= 0 ? "text-green-500" : "text-red-500"}>
                      {formatCurrency(outcomes.expectedReturn)}
                    </span>
                  </div>
                </div>
                
                <div className="p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-md">
                  <div className="text-sm text-blue-800 dark:text-blue-400">
                    <p className="font-medium">Optimal Setup:</p>
                    <p>
                      With your historical win rate of {positionSizing.riskRewardRatios.winRate.toFixed(1)}%, 
                      your optimal risk-reward ratio is {positionSizing.riskRewardRatios.optimalRatio.toFixed(2)}:1
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Kelly Criterion</h3>
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Optimal Bet Size</div>
                <div className="text-2xl font-bold">{positionSizing.riskRewardRatios.kellyPercentage.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground mt-1">of your account balance</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div>Win Rate:</div>
                  <div className="font-medium">{positionSizing.riskRewardRatios.winRate.toFixed(1)}%</div>
                </div>
                <div className="flex justify-between text-sm">
                  <div>Optimal R:R:</div>
                  <div className="font-medium">{positionSizing.riskRewardRatios.optimalRatio.toFixed(2)}:1</div>
                </div>
                <div className="flex justify-between text-sm">
                  <div>Half Kelly (Conservative):</div>
                  <div className="font-medium">{(positionSizing.riskRewardRatios.kellyPercentage / 2).toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/30 rounded-md">
                <div className="text-sm text-yellow-800 dark:text-yellow-400">
                  <p className="font-medium">Kelly Formula:</p>
                  <p>
                    K% = W - [(1-W)/R]
                  </p>
                  <p className="text-xs mt-1">
                    Where W is win rate and R is risk-reward ratio
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="expected-value">
            <TrendingUp className="mr-2 h-4 w-4" />
            Expected Value
          </TabsTrigger>
          <TabsTrigger value="kelly-criterion">
            <BarChart2 className="mr-2 h-4 w-4" />
            Kelly Criterion
          </TabsTrigger>
          <TabsTrigger value="monte-carlo">
            <PieChart className="mr-2 h-4 w-4" />
            Monte Carlo
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="expected-value" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                  <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                </div>}>
                  {typeof window !== 'undefined' && (
                    <ReactApexChart
                      options={expectedValueData.options}
                      series={expectedValueData.series}
                      type="line"
                      height={350}
                    />
                  )}
                </Suspense>
              </div>
              <div className="mt-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-md">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  <p className="font-medium">Understanding Expected Value:</p>
                  <p>
                    Expected Value (EV) shows your average long-term return per trade. A positive EV means your strategy is profitable over time.
                    The chart shows how different win rates and risk-reward ratios affect your expected value.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="kelly-criterion" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                  <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                </div>}>
                  {typeof window !== 'undefined' && (
                    <ReactApexChart
                      options={kellyData.options}
                      series={kellyData.series}
                      type="bar"
                      height={350}
                    />
                  )}
                </Suspense>
              </div>
              <div className="mt-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-md">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  <p className="font-medium">Understanding Kelly Criterion:</p>
                  <p>
                    The Kelly Criterion calculates the optimal percentage of your capital to risk on each trade to maximize long-term growth.
                    Most professional traders use a "Half Kelly" approach (half the calculated percentage) for more conservative risk management.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monte-carlo" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <Suspense fallback={<div className="flex items-center justify-center h-[400px] w-full">
                  <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                </div>}>
                  {typeof window !== 'undefined' && (
                    <ReactApexChart
                      options={simulatorData.options}
                      series={simulatorData.series}
                      type="line"
                      height={350}
                    />
                  )}
                </Suspense>
              </div>
              <div className="mt-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-md">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  <p className="font-medium">Understanding Monte Carlo Simulation:</p>
                  <p>
                    This simulation shows how your account balance might evolve over 100 trades with your current win rate and risk-reward ratio.
                    Each time you view this chart, a new random simulation is generated based on your parameters.
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

export default RiskRewardVisualizer;
