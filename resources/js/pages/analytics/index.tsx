import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PerformanceCharts, { PerformanceData } from '@/components/analytics/performance-charts';
import { ArrowUpRight, ArrowDownRight, Timer, BarChart3, TrendingUp, Percent, DollarSign, Scale } from 'lucide-react';

interface AnalyticsProps {
  performanceData: PerformanceData;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Analytics',
    href: '/analytics',
  },
];

export default function Analytics({ performanceData }: AnalyticsProps) {
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Format percentage values
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Format time duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Calculate win rate
  const winRate = performanceData.winLossRatio.values[0] > 0
    ? (performanceData.winLossRatio.values[0] / 
       performanceData.winLossRatio.values.reduce((a, b) => a + b, 0)) * 100
    : 0;
    
  // Get total P&L
  const totalPnL = performanceData.cumulativePnL.values.length > 0
    ? performanceData.cumulativePnL.values[performanceData.cumulativePnL.values.length - 1]
    : 0;
    
  // Get best performing asset
  const bestAsset = performanceData.assetPerformance.assets.length > 0
    ? performanceData.assetPerformance.assets[0]
    : 'N/A';
    
  const bestAssetPerformance = performanceData.assetPerformance.performance.length > 0
    ? performanceData.assetPerformance.performance[0]
    : 0;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Performance Analytics" />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Performance Charts */}
        <PerformanceCharts data={performanceData} />
        
        {/* Key Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {performanceData.winLossRatio.values.reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {winRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center ${
                totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span className="text-2xl font-bold">
                  {formatCurrency(totalPnL)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Best Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestAsset}</div>
              <p className={`flex items-center text-sm ${
                bestAssetPerformance >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {bestAssetPerformance >= 0 ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
                {formatCurrency(bestAssetPerformance)}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Advanced Metrics */}
        <h2 className="text-xl font-bold mt-4 mb-2">Advanced Performance Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Sharpe Ratio */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {performanceData.metrics.sharpeRatio.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Risk-adjusted return (higher is better)
              </p>
            </CardContent>
          </Card>
          
          {/* Max Drawdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-red-500">
                <ArrowDownRight className="mr-2 h-4 w-4" />
                <span className="text-2xl font-bold">
                  {formatCurrency(performanceData.metrics.maxDrawdown)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatPercent(performanceData.metrics.maxDrawdownPercent)} from peak
              </p>
            </CardContent>
          </Card>
          
          {/* Profit Factor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Scale className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {performanceData.metrics.profitFactor.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gross profit / Gross loss ({'>'}1 is profitable)
              </p>
            </CardContent>
          </Card>
          
          {/* Average Trade Duration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Trade Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Timer className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {formatDuration(performanceData.metrics.avgTradeDuration)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trade Performance */}
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          {/* Average Winning Trade */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Trade Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Winning Trade</p>
                  <p className="text-xl font-bold text-green-500">
                    {formatCurrency(performanceData.metrics.avgWinningTrade)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Losing Trade</p>
                  <p className="text-xl font-bold text-red-500">
                    {formatCurrency(performanceData.metrics.avgLosingTrade)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Expectancy (per trade)</p>
                <p className={`text-xl font-bold ${performanceData.metrics.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(performanceData.metrics.expectancy)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Win/Loss Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Win/Loss Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[100px] w-full relative">
                <div className="flex h-full">
                  {/* Winning Trades Bar */}
                  <div 
                    className="bg-green-500 h-full flex items-end justify-center"
                    style={{ 
                      width: `${winRate}%`,
                      minWidth: performanceData.winLossRatio.values[0] > 0 ? '2%' : '0%'
                    }}
                  >
                    {performanceData.winLossRatio.values[0] > 0 && (
                      <span className="text-xs font-medium text-white p-1">
                        {performanceData.winLossRatio.values[0]}
                      </span>
                    )}
                  </div>
                  
                  {/* Losing Trades Bar */}
                  <div 
                    className="bg-red-500 h-full flex items-end justify-center"
                    style={{ 
                      width: `${100 - winRate}%`,
                      minWidth: performanceData.winLossRatio.values[1] > 0 ? '2%' : '0%'
                    }}
                  >
                    {performanceData.winLossRatio.values[1] > 0 && (
                      <span className="text-xs font-medium text-white p-1">
                        {performanceData.winLossRatio.values[1]}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Labels */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <div>Win: {winRate.toFixed(1)}%</div>
                  <div>Loss: {(100 - winRate).toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
