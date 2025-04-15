import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils';

interface OrderBookProps {
  pairId: string;
}

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  type: 'ask' | 'bid';
}

export default function OrderBook({ pairId }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<{
    asks: OrderBookEntry[];
    bids: OrderBookEntry[];
    spread: number;
    spreadPercentage: number;
  }>({
    asks: [],
    bids: [],
    spread: 0,
    spreadPercentage: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<'both' | 'bids' | 'asks'>('both');
  const [grouping, setGrouping] = useState(0.1);
  
  // Fetch order book data when pairId changes
  useEffect(() => {
    if (!pairId) return;
    
    setLoading(true);
    
    // Simulate API call to fetch order book
    const fetchOrderBook = async () => {
      try {
        // In a real app, this would be an API call
        // For demo, we'll generate random order book data
        const basePrice = 50000 + Math.random() * 5000;
        const asks: OrderBookEntry[] = [];
        const bids: OrderBookEntry[] = [];
        
        // Generate asks (sell orders)
        let askTotal = 0;
        for (let i = 0; i < 15; i++) {
          const price = basePrice + (i * grouping);
          const amount = Math.random() * 2;
          askTotal += amount;
          
          asks.push({
            price,
            amount,
            total: askTotal,
            type: 'ask'
          });
        }
        
        // Generate bids (buy orders)
        let bidTotal = 0;
        for (let i = 0; i < 15; i++) {
          const price = basePrice - (i * grouping);
          const amount = Math.random() * 2;
          bidTotal += amount;
          
          bids.push({
            price,
            amount,
            total: bidTotal,
            type: 'bid'
          });
        }
        
        // Calculate spread
        const lowestAsk = asks[0].price;
        const highestBid = bids[0].price;
        const spread = lowestAsk - highestBid;
        const spreadPercentage = (spread / lowestAsk) * 100;
        
        setOrderBook({
          asks,
          bids,
          spread,
          spreadPercentage
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch order book:', err);
        setLoading(false);
      }
    };
    
    fetchOrderBook();
    
    // Set up interval to refresh order book
    const interval = setInterval(fetchOrderBook, 5000);
    
    return () => clearInterval(interval);
  }, [pairId, grouping]);
  
  // Find the maximum total for scaling the depth visualization
  const maxTotal = Math.max(
    orderBook.asks.length > 0 ? orderBook.asks[orderBook.asks.length - 1].total : 0,
    orderBook.bids.length > 0 ? orderBook.bids[orderBook.bids.length - 1].total : 0
  );
  
  // Handle price click (would set the price in the order form in a real app)
  const handlePriceClick = (price: number) => {
    console.log('Selected price:', price);
    // In a real app, this would update the price in the order form
  };
  
  // Change the price grouping
  const handleGroupingChange = (value: number) => {
    setGrouping(value);
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Badge 
            className={`cursor-pointer ${displayMode === 'both' ? 'bg-[#8D5EB7]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => setDisplayMode('both')}
          >
            Both
          </Badge>
          <Badge 
            className={`cursor-pointer ${displayMode === 'bids' ? 'bg-green-600' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => setDisplayMode('bids')}
          >
            Bids
          </Badge>
          <Badge 
            className={`cursor-pointer ${displayMode === 'asks' ? 'bg-red-600' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => setDisplayMode('asks')}
          >
            Asks
          </Badge>
        </div>
        
        <div className="flex space-x-1 text-xs">
          <Badge 
            className={`cursor-pointer ${grouping === 0.01 ? 'bg-[#8D5EB7]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => handleGroupingChange(0.01)}
          >
            0.01
          </Badge>
          <Badge 
            className={`cursor-pointer ${grouping === 0.1 ? 'bg-[#8D5EB7]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => handleGroupingChange(0.1)}
          >
            0.1
          </Badge>
          <Badge 
            className={`cursor-pointer ${grouping === 1 ? 'bg-[#8D5EB7]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => handleGroupingChange(1)}
          >
            1
          </Badge>
          <Badge 
            className={`cursor-pointer ${grouping === 10 ? 'bg-[#8D5EB7]' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => handleGroupingChange(10)}
          >
            10
          </Badge>
        </div>
      </div>
      
      <div className="text-xs grid grid-cols-3 font-medium text-muted-foreground border-b pb-1 mb-1">
        <div>Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>
      
      {/* Asks (Sell Orders) */}
      {(displayMode === 'both' || displayMode === 'asks') && (
        <div className="space-y-1 mb-2">
          {orderBook.asks.slice().reverse().map((ask, index) => (
            <div 
              key={`ask-${index}`} 
              className="relative text-xs grid grid-cols-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => handlePriceClick(ask.price)}
            >
              <div 
                className="absolute right-0 top-0 h-full bg-red-100 dark:bg-red-900/20 z-0"
                style={{ width: `${(ask.total / maxTotal) * 100}%` }}
              ></div>
              <div className="text-red-600 dark:text-red-400 z-10">{ask.price.toFixed(2)}</div>
              <div className="text-right z-10">{ask.amount.toFixed(6)}</div>
              <div className="text-right z-10">{ask.total.toFixed(6)}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Spread */}
      {displayMode === 'both' && (
        <div className="text-xs py-1 px-2 bg-gray-100 dark:bg-gray-800 rounded flex justify-between my-2">
          <span>Spread</span>
          <span>{formatCurrency(orderBook.spread)} ({orderBook.spreadPercentage.toFixed(2)}%)</span>
        </div>
      )}
      
      {/* Bids (Buy Orders) */}
      {(displayMode === 'both' || displayMode === 'bids') && (
        <div className="space-y-1">
          {orderBook.bids.map((bid, index) => (
            <div 
              key={`bid-${index}`} 
              className="relative text-xs grid grid-cols-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => handlePriceClick(bid.price)}
            >
              <div 
                className="absolute right-0 top-0 h-full bg-green-100 dark:bg-green-900/20 z-0"
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              ></div>
              <div className="text-green-600 dark:text-green-400 z-10">{bid.price.toFixed(2)}</div>
              <div className="text-right z-10">{bid.amount.toFixed(6)}</div>
              <div className="text-right z-10">{bid.total.toFixed(6)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
