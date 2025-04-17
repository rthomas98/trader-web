import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface RiskProfileProps {
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

const RiskProfile: React.FC<RiskProfileProps> = ({ riskProfile }) => {
  // Format percentage
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0.00%';
    }
    return `${Number(value).toFixed(2)}%`;
  };

  // Get risk profile icon and color
  const getRiskProfileInfo = (level: string) => {
    switch (level) {
      case 'conservative':
        return {
          icon: <Shield className="h-5 w-5" />,
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          description: 'You prioritize capital preservation over high returns. Your trading approach focuses on minimizing losses with tight stop losses and conservative position sizing.'
        };
      case 'aggressive':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          description: 'You prioritize high returns and are willing to accept larger drawdowns. Your trading approach involves larger position sizes and wider stop losses.'
        };
      case 'moderate':
      default:
        return {
          icon: <TrendingUp className="h-5 w-5" />,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          description: 'You balance risk and reward, seeking consistent returns while managing drawdowns. Your trading approach uses reasonable position sizes and appropriate stop losses.'
        };
    }
  };

  const riskProfileInfo = getRiskProfileInfo(riskProfile.riskToleranceLevel);

  // Calculate risk-reward ratio based on historical data
  const calculateRiskRewardRatio = () => {
    const totalProfit = riskProfile.historicalRisk.reduce((sum, day) => sum + day.total_profit, 0);
    const totalLoss = riskProfile.historicalRisk.reduce((sum, day) => sum + day.total_loss, 0);
    
    if (totalLoss === 0) return 0;
    return totalProfit / totalLoss;
  };

  const riskRewardRatio = calculateRiskRewardRatio();

  // Calculate win rate based on historical data
  const calculateWinRate = () => {
    const totalTrades = riskProfile.historicalRisk.reduce((sum, day) => sum + day.trade_count, 0);
    const winningTrades = riskProfile.historicalRisk.filter(day => day.total_profit > day.total_loss).reduce((sum, day) => sum + day.trade_count, 0);
    
    if (totalTrades === 0) return 0;
    return (winningTrades / totalTrades) * 100;
  };

  const winRate = calculateWinRate();

  return (
    <div className="space-y-4">
      {/* Risk Tolerance Level */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Risk Tolerance Level</h3>
        <Badge className={riskProfileInfo.color}>
          <div className="flex items-center">
            {riskProfileInfo.icon}
            <span className="ml-1 capitalize">{riskProfile.riskToleranceLevel}</span>
          </div>
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {riskProfileInfo.description}
      </p>
      
      <Separator className="my-4" />
      
      {/* Risk Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium">Risk Per Trade</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-1 h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The percentage of your account you risk on each trade.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm font-medium">{formatPercentage(riskProfile.riskPercentage)}</span>
          </div>
          <Progress 
            value={riskProfile.riskPercentage * 10} 
            max={100}
            className={`h-2 mt-2 ${
              riskProfile.riskPercentage > 5 ? 'bg-red-500' : 
              riskProfile.riskPercentage > 2 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium">Avg Risk Per Trade</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-1 h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The average percentage risk based on your historical trades.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm font-medium">{formatPercentage(riskProfile.avgRiskPerTrade)}</span>
          </div>
          <Progress 
            value={riskProfile.avgRiskPerTrade * 10} 
            max={100}
            className={`h-2 mt-2 ${
              riskProfile.avgRiskPerTrade > 5 ? 'bg-red-500' : 
              riskProfile.avgRiskPerTrade > 2 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-muted p-3 rounded-md">
          <div className="text-xs text-muted-foreground">Risk-Reward Ratio</div>
          <div className="text-lg font-bold">{riskRewardRatio.toFixed(2)}:1</div>
          <div className="text-xs text-muted-foreground mt-1">
            {riskRewardRatio >= 2 ? 'Excellent' : 
             riskRewardRatio >= 1.5 ? 'Good' : 
             riskRewardRatio >= 1 ? 'Acceptable' : 
             'Needs improvement'}
          </div>
        </div>
        
        <div className="bg-muted p-3 rounded-md">
          <div className="text-xs text-muted-foreground">Win Rate</div>
          <div className="text-lg font-bold">{formatPercentage(winRate)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {winRate >= 60 ? 'Excellent' : 
             winRate >= 50 ? 'Good' : 
             winRate >= 40 ? 'Acceptable' : 
             'Needs improvement'}
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Risk Recommendations */}
      <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 p-3">
        <div className="text-sm text-blue-800 dark:text-blue-400">
          <p className="font-medium mb-1">Risk Management Recommendations:</p>
          <ul className="list-disc pl-5 space-y-1">
            {riskProfile.riskPercentage > 2 && (
              <li>Consider reducing your risk per trade to 1-2% for better capital preservation</li>
            )}
            {riskRewardRatio < 1.5 && (
              <li>Aim for a risk-reward ratio of at least 1.5:1 on each trade</li>
            )}
            {winRate < 50 && (
              <li>Focus on improving your win rate or increasing your risk-reward ratio</li>
            )}
            {riskProfile.riskToleranceLevel === 'aggressive' && (
              <li>Your aggressive risk profile may lead to larger drawdowns; consider more conservative position sizing</li>
            )}
            <li>Always use stop losses to limit potential losses on each trade</li>
            <li>Regularly review and adjust your risk parameters based on market conditions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RiskProfile;
