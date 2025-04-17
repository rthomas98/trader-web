import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign,
  Award,
  BookText,
  AlertTriangle
} from 'lucide-react';

interface JournalStatistics {
  total_entries: number;
  entries_by_type: {
    [key: string]: number;
  };
  win_loss_stats: {
    wins: number;
    losses: number;
    breakeven: number;
    pending: number;
    win_rate: number;
  };
  avg_risk_reward: number;
  avg_profit_loss: number;
  total_profit_loss: number;
  most_traded_pairs: {
    [key: string]: number;
  };
  emotional_outcomes: {
    [key: string]: {
      [key: string]: number;
    };
  };
}

interface JournalStatisticsProps {
  stats: JournalStatistics;
}

export default function JournalStatistics({ stats }: JournalStatisticsProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Get top traded pair
  const getTopTradedPair = () => {
    if (Object.keys(stats.most_traded_pairs).length === 0) return 'N/A';
    
    const pairs = Object.entries(stats.most_traded_pairs);
    pairs.sort((a, b) => b[1] - a[1]);
    
    return pairs[0][0];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Entries */}
      <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
              <h3 className="text-2xl font-bold mt-1">{stats.total_entries}</h3>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <span className="mr-1">Ideas:</span>
                  <span className="font-medium">{stats.entries_by_type.idea || 0}</span>
                </div>
                <span className="mx-1">•</span>
                <div className="flex items-center">
                  <span className="mr-1">Strategies:</span>
                  <span className="font-medium">{stats.entries_by_type.strategy || 0}</span>
                </div>
              </div>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <BookText className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                {formatPercentage(stats.win_loss_stats.win_rate)}
              </h3>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <span className="mr-1">W:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{stats.win_loss_stats.wins}</span>
                </div>
                <span className="mx-1">•</span>
                <div className="flex items-center">
                  <span className="mr-1">L:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{stats.win_loss_stats.losses}</span>
                </div>
                <span className="mx-1">•</span>
                <div className="flex items-center">
                  <span className="mr-1">BE:</span>
                  <span className="font-medium">{stats.win_loss_stats.breakeven}</span>
                </div>
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
              <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Risk/Reward */}
      <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Risk/Reward</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                {stats.avg_risk_reward.toFixed(2)}
              </h3>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <span className="mr-1">Top Pair:</span>
                  <span className="font-medium">{getTopTradedPair()}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total P/L */}
      <Card className={`bg-white dark:bg-gray-950 border-l-4 ${stats.total_profit_loss >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total P/L</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.total_profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(stats.total_profit_loss)}
              </h3>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <span className="mr-1">Avg P/L:</span>
                  <span className={`font-medium ${stats.avg_profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(stats.avg_profit_loss)}
                  </span>
                </div>
              </div>
            </div>
            <div className={`p-2 rounded-full ${stats.total_profit_loss >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <DollarSign className={`h-5 w-5 ${stats.total_profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
