import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface RiskManagementSummaryProps {
  currentDrawdown: number;
  currentDrawdownPercentage: number;
  maxAllowedDrawdown: number;
  riskToleranceLevel: 'conservative' | 'moderate' | 'aggressive';
  alertCount: number;
}

const RiskManagementSummary: React.FC<RiskManagementSummaryProps> = ({
  currentDrawdown,
  currentDrawdownPercentage,
  maxAllowedDrawdown,
  riskToleranceLevel,
  alertCount,
}) => {
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

  // Get progress color based on percentage
  const getProgressColor = (percentage: number, maxAllowed: number) => {
    const ratio = percentage / maxAllowed;
    if (ratio >= 0.75) return 'bg-red-500';
    if (ratio >= 0.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get risk profile icon and color
  const getRiskProfileInfo = (level: string) => {
    switch (level) {
      case 'conservative':
        return {
          icon: <Shield className="h-5 w-5 text-green-500" />,
          color: 'text-green-500',
        };
      case 'aggressive':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          color: 'text-red-500',
        };
      case 'moderate':
      default:
        return {
          icon: <Shield className="h-5 w-5 text-blue-500" />,
          color: 'text-blue-500',
        };
    }
  };

  const riskProfileInfo = getRiskProfileInfo(riskToleranceLevel);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Risk Management</CardTitle>
        <CardDescription>Current risk status and alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Drawdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingDown className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Drawdown</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">
                  {formatCurrency(currentDrawdown)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({formatPercentage(currentDrawdownPercentage)})
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <Progress 
                value={(currentDrawdownPercentage / maxAllowedDrawdown) * 100} 
                max={100}
                className={`h-2 ${getProgressColor(currentDrawdownPercentage, maxAllowedDrawdown)}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>Max: {formatPercentage(maxAllowedDrawdown)}</span>
              </div>
            </div>
          </div>
          
          {/* Risk Profile & Alerts */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {riskProfileInfo.icon}
              <span className={`ml-2 text-sm font-medium capitalize ${riskProfileInfo.color}`}>
                {riskToleranceLevel} Profile
              </span>
            </div>
            
            {alertCount > 0 && (
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-500">{alertCount} Alert{alertCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          
          {/* Action Button */}
          <Button asChild className="w-full mt-2" variant="outline">
            <Link href="/risk-management">View Risk Dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskManagementSummary;
