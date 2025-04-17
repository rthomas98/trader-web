import React from 'react';
import { AlertCircle, AlertTriangle, Info, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DrawdownAlert {
  level: 'critical' | 'warning' | 'caution' | 'position';
  message: string;
  percentage: number;
  position_id?: number;
  timestamp: string;
}

interface DrawdownAlertsProps {
  drawdownAlerts: {
    currentDrawdown: number;
    currentDrawdownPercentage: number;
    maxAllowedDrawdown: number;
    alerts: DrawdownAlert[];
  };
}

const DrawdownAlerts: React.FC<DrawdownAlertsProps> = ({ drawdownAlerts }) => {
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Determine progress color based on percentage
  const getProgressColor = (percentage: number, maxAllowed: number) => {
    const ratio = percentage / maxAllowed;
    if (ratio >= 0.75) return 'bg-red-500';
    if (ratio >= 0.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get alert icon based on level
  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'caution':
        return <Info className="h-5 w-5" />;
      case 'position':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  // Get alert variant based on level
  const getAlertVariant = (level: string): 'destructive' | 'default' => {
    return level === 'critical' ? 'destructive' : 'default';
  };

  return (
    <div className="space-y-4">
      {/* Current Drawdown Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-sm font-medium">Current Drawdown</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="ml-1 h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">The current unrealized loss from your account's peak value.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium">
              {formatCurrency(drawdownAlerts.currentDrawdown)}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              ({formatPercentage(drawdownAlerts.currentDrawdownPercentage)})
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <Progress 
            value={(drawdownAlerts.currentDrawdownPercentage / drawdownAlerts.maxAllowedDrawdown) * 100} 
            max={100}
            className={`h-2 ${getProgressColor(drawdownAlerts.currentDrawdownPercentage, drawdownAlerts.maxAllowedDrawdown)}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>Max: {formatPercentage(drawdownAlerts.maxAllowedDrawdown)}</span>
          </div>
        </div>
      </div>

      {/* Drawdown Status */}
      <div className="rounded-md border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Drawdown Status</h3>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            drawdownAlerts.currentDrawdownPercentage >= drawdownAlerts.maxAllowedDrawdown * 0.75
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              : drawdownAlerts.currentDrawdownPercentage >= drawdownAlerts.maxAllowedDrawdown * 0.5
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {drawdownAlerts.currentDrawdownPercentage >= drawdownAlerts.maxAllowedDrawdown * 0.75
              ? 'High Risk'
              : drawdownAlerts.currentDrawdownPercentage >= drawdownAlerts.maxAllowedDrawdown * 0.5
              ? 'Moderate Risk'
              : 'Low Risk'}
          </span>
        </div>
        
        <div className="mt-2 text-sm">
          {drawdownAlerts.currentDrawdownPercentage >= drawdownAlerts.maxAllowedDrawdown * 0.75 ? (
            <p className="text-red-600 dark:text-red-400">
              Your current drawdown is approaching your maximum threshold. Consider reducing your exposure.
            </p>
          ) : drawdownAlerts.currentDrawdownPercentage >= drawdownAlerts.maxAllowedDrawdown * 0.5 ? (
            <p className="text-yellow-600 dark:text-yellow-400">
              Your drawdown is at a moderate level. Monitor your positions closely.
            </p>
          ) : (
            <p className="text-green-600 dark:text-green-400">
              Your drawdown is within acceptable limits.
            </p>
          )}
        </div>
      </div>

      {/* Active Alerts */}
      {drawdownAlerts.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Active Alerts</h3>
          
          {drawdownAlerts.alerts.map((alert, index) => (
            <Alert key={index} variant={getAlertVariant(alert.level)}>
              <div className="flex items-start">
                {getAlertIcon(alert.level)}
                <div className="ml-3 w-full">
                  <AlertTitle className="text-sm font-medium">
                    {alert.level === 'critical' ? 'Critical Alert' : 
                     alert.level === 'warning' ? 'Warning Alert' : 
                     alert.level === 'caution' ? 'Caution Alert' : 
                     'Position Alert'}
                  </AlertTitle>
                  <AlertDescription className="mt-1 text-sm">
                    <div className="flex flex-col space-y-1">
                      <p>{alert.message}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Drawdown: {formatPercentage(alert.percentage)}</span>
                        <span>{formatDate(alert.timestamp)}</span>
                      </div>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* No Active Alerts */}
      {drawdownAlerts.alerts.length === 0 && (
        <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-green-600 dark:text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-400">No Active Alerts</h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                <p>
                  You have no active drawdown alerts. Your account is within safe risk parameters.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Management Tips */}
      <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 p-3">
        <div className="text-sm text-blue-800 dark:text-blue-400">
          <p className="font-medium mb-1">Risk Management Tips:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Keep your maximum drawdown below {formatPercentage(drawdownAlerts.maxAllowedDrawdown)}</li>
            <li>Consider closing losing positions that exceed 10% drawdown</li>
            <li>Diversify your trades across different currency pairs</li>
            <li>Use proper position sizing to limit risk per trade</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DrawdownAlerts;
