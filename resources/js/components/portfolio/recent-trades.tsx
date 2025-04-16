import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Interface matching the data from PortfolioService::getRecentClosedTrades
export interface Trade {
  pair: string;
  type: string;       // 'Buy' or 'Sell'
  amount: string;     // Formatted number as string
  price: string;      // Formatted number as string
  profit: string;     // Formatted profit/loss as string (e.g., '+$25.50')
  timestamp: string;  // Formatted time ago string (e.g., '5 minutes ago')
}

interface RecentTradesProps {
  trades: Trade[];
  loading: boolean;
}

export function RecentTrades({ trades, loading }: RecentTradesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        {/* Optional: Add CardDescription if needed */}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                {/* Adjust skeleton layout if needed */}
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : trades.length > 0 ? (
          <div className="space-y-6">
            {trades.map((trade, index) => (
              <div key={index} className="flex items-center">
                {/* Optional: Add Avatar/Icon based on pair/type if desired */}
                {/* <Avatar className="h-9 w-9">
                  <AvatarImage src={`/avatars/${trade.pair.split('/')[0]}.png`} alt="Avatar" />
                  <AvatarFallback>{trade.pair.substring(0, 2)}</AvatarFallback>
                </Avatar> */}
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{trade.pair}</p>
                  <p className="text-sm text-muted-foreground">
                    {trade.type} {trade.amount} @ {trade.price}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p
                    className={`text-sm font-medium ${trade.profit.startsWith('+') ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}
                  >
                    {trade.profit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trade.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent closed trades found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
