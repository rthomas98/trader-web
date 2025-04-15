import React, { useState, useEffect } from 'react';
// import { Badge } from '@/components/ui/badge'; // Comment out unused import
import { formatCurrency } from '@/utils';

interface TradeHistoryProps {
  pairId: string;
}

interface Trade {
  id: string;
  price: number;
  amount: number;
  total: number;
  side: 'buy' | 'sell';
  timestamp: Date;
}

export default function TradeHistory({ pairId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch trade history when pairId changes
  useEffect(() => {
    if (!pairId) return;
    
    setLoading(true);
    
    // Simulate API call to fetch trade history
    const fetchTradeHistory = async () => {
      try {
        // In a real app, this would be an API call
        // For demo, we'll generate random trade history
        const basePrice = 50000 + Math.random() * 5000;
        const newTrades: Trade[] = [];
        
        for (let i = 0; i < 20; i++) {
          const side = Math.random() > 0.5 ? 'buy' : 'sell';
          const price = basePrice + (Math.random() - 0.5) * 100;
          const amount = Math.random() * 2;
          const timestamp = new Date();
          timestamp.setMinutes(timestamp.getMinutes() - i * 2);
          
          newTrades.push({
            id: `trade-${Date.now()}-${i}`,
            price,
            amount,
            total: price * amount,
            side,
            timestamp
          });
        }
        
        setTrades(newTrades);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch trade history:', err);
        setLoading(false);
      }
    };
    
    fetchTradeHistory();
    
    // Set up interval to refresh trade history
    const interval = setInterval(fetchTradeHistory, 10000);
    
    return () => clearInterval(interval);
  }, [pairId]);
  
  // Format time as HH:MM:SS
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      <div className="text-xs grid grid-cols-3 font-medium text-muted-foreground border-b pb-1 mb-1">
        <div>Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Time</div>
      </div>
      
      {trades.map((trade) => (
        <div 
          key={trade.id} 
          className="text-xs grid grid-cols-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <div className={trade.side === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {formatCurrency(trade.price)}
          </div>
          <div className="text-right">{trade.amount.toFixed(6)}</div>
          <div className="text-right text-muted-foreground">{formatTime(trade.timestamp)}</div>
        </div>
      ))}
    </div>
  );
}
