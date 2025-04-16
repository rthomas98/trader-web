import React, { useState, useEffect, useCallback } from 'react';
import { Head, router, usePage, useForm } from "@inertiajs/react";
import axios from "axios";
import AppLayout from '@/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppearance } from '@/hooks/use-appearance';
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import TradingChart from '@/components/trading/trading-chart';
import { AvailablePairs } from '@/types/currency-pair';

// Define types for our data
interface Position {
  id: number;
  user_id: number;
  currency_pair: string;
  trade_type: string;
  type?: string; // Keep for backward compatibility
  quantity: number;
  amount?: number; // Keep for backward compatibility
  open_price?: number;
  entry_price?: number;
  stop_loss: number | null;
  take_profit: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Account {
  balance: number;
  available_margin: number;
  leverage: number;
  risk_percentage: number;
  mode?: 'DEMO' | 'LIVE';
}

interface MarketOverviewItem {
  symbol: string;
  price: number;
  change: string;
}

interface MarketOverview {
  indices: MarketOverviewItem[];
  forex: MarketOverviewItem[];
  crypto: MarketOverviewItem[];
}

interface TradingProps {
  positions?: Position[];
  account?: Account;
  marketOverview?: MarketOverview;
  availablePairs?: AvailablePairs;
  pendingOrders?: TradingOrder[]; // Add pendingOrders prop
}

interface TradingOrder { // Define TradingOrder type based on backend model
  id: string | number; // Assuming UUID or number
  user_id: number;
  trading_wallet_id: string; // Assuming UUID
  currency_pair: string;
  order_type: string; // e.g., LIMIT, MARKET
  side: string; // e.g., BUY, SELL
  quantity: number;
  price: number | null; // Market orders might not have a price
  stop_loss: number | null;
  take_profit: number | null;
  time_in_force: string;
  status: string; // e.g., PENDING, FILLED, CANCELLED
  created_at: string;
  updated_at: string;
}

interface CurrentPrice {
  price: number;
  timestamp: string;
  symbol?: string;
  change?: number;
  change_percent?: number;
}

interface OrderFormData {
  [key: string]: string | number | null | boolean; // Refined index signature
  trading_wallet_id: string | number | null; // Allow null
  currency_pair: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
}

// Define CandleData type locally
interface CandleData {
  x: Date;
  y: [number, number, number, number]; // [open, high, low, close]
  pair?: string;
}

// Define SimpleSelect props locally
interface SimpleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  id?: string;
  className?: string;
}

// Format currency helper function
const formatCurrency = (value: number | undefined | null): string => {
  const safeValue = value ?? 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeValue);
};

// Restore SimpleSelect component definition
const SimpleSelect: React.FC<SimpleSelectProps> = ({ value, onChange, options, placeholder, id, className }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn("w-[180px]", className)}>
        <SelectValue placeholder={placeholder || "Select..."} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option: { value: string | number; label: string }) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const Trading = ({ 
  positions = [], 
  account = { balance: 0, available_margin: 0, leverage: 0, risk_percentage: 0, mode: 'DEMO' },
  marketOverview = { indices: [], forex: [], crypto: [] },
  availablePairs = { forex: [], crypto: [], commodities: [], indices: [] },
  pendingOrders = [] // Add pendingOrders prop
}: TradingProps) => {
  const { props } = usePage();
  const { flash } = props as unknown as { flash: { success?: string; error?: string } }; // Type assertion for flash
  const { toast } = useToast();

  const [selectedPair, setSelectedPair] = useState(availablePairs?.forex?.[0]?.symbol || 'EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');
  const [predictiveMode, setPredictiveMode] = useState<boolean>(false);
  
  const { appearance } = useAppearance();
  
  // Fetch current prices
  const fetchCurrentPrices = useCallback(async () => {
    try {
      const response = await axios.get('/trading/chart-data', {
        params: {
          currency_pair: selectedPair,
          timeframe: selectedTimeframe
        }
      });
      if (response.data) {
        setCurrentPrices(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch current prices:', error);
      
      // Fallback: Generate mock data for the chart when the API fails
      const fallbackPrices: Record<string, CurrentPrice> = {};
      
      // Base prices for common currency pairs
      const basePrices: Record<string, number> = {
        'EUR/USD': 1.0876,
        'USD/JPY': 151.62,
        'GBP/USD': 1.2542,
        'USD/CHF': 0.9042,
        'AUD/USD': 0.6614,
        'USD/CAD': 1.3614,
        'NZD/USD': 0.6014,
      };
      
      // Create fallback data for the selected pair
      const basePrice = basePrices[selectedPair] || 1.0;
      // Add a small random variation to simulate market movement
      const randomVariation = (Math.random() * 0.02) - 0.01; // -1% to +1%
      fallbackPrices[selectedPair] = {
        price: basePrice * (1 + randomVariation),
        timestamp: new Date().toISOString()
      };
      
      // Also ensure we have prices for all positions
      positions.forEach(position => {
        if (!fallbackPrices[position.currency_pair]) {
          const posBasePrice = basePrices[position.currency_pair] || position.open_price || 1.0;
          const posRandomVariation = (Math.random() * 0.02) - 0.01;
          fallbackPrices[position.currency_pair] = {
            price: posBasePrice * (1 + posRandomVariation),
            timestamp: new Date().toISOString()
          };
        }
      });
      
      setCurrentPrices(fallbackPrices);
    }
  }, [selectedPair, selectedTimeframe, positions]);
  
  // Set up axios defaults and initialize
  useEffect(() => {
    // Configure axios for Laravel Sanctum
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    
    // Get the CSRF token from the meta tag and set it as a default header
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    } else {
      console.warn('CSRF token not found in meta tags');
    }
    
    // Initialize CSRF protection for Sanctum
    const initCsrf = async () => {
      try {
        // This endpoint sets the CSRF cookie
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF cookie initialized successfully');
        
        // Now fetch current prices
        fetchCurrentPrices();
      } catch (error) {
        console.error('Error initializing CSRF protection:', error);
        // Try to fetch prices anyway
        fetchCurrentPrices();
      }
    };
    
    // Initialize CSRF protection
    initCsrf();
    
    // Set up interval for fetching prices
    const interval = setInterval(fetchCurrentPrices, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [fetchCurrentPrices]);
  
  // Update chart when pair, timeframe, or appearance changes
  const updateChart = useCallback(() => {
    const chartFrame = document.getElementById('trading-chart-frame') as HTMLIFrameElement;
    if (chartFrame && chartFrame.contentWindow) {
      chartFrame.contentWindow.postMessage({
        type: 'updateChart',
        currencyPair: selectedPair,
        timeframe: selectedTimeframe,
        predictiveMode: predictiveMode,
        theme: appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'
      }, '*');
    }
  }, [selectedPair, selectedTimeframe, predictiveMode, appearance]);
  
  useEffect(() => {
    updateChart();
  }, [selectedPair, selectedTimeframe, predictiveMode, appearance, updateChart]);
  
  useEffect(() => {
    if (flash?.success) {
      toast({
        title: "Success",
        description: flash.success,
      });
    }
    if (flash?.error) {
      toast({
        title: "Error",
        description: flash.error,
        variant: "destructive",
      });
    }
  }, [flash, toast]);

  const [currentPrices, setCurrentPrices] = useState<Record<string, CurrentPrice>>({});

  const handleClosePosition = (position: Position) => {
    // Add the logic to close the position directly here
    router.post(`/trading/positions/${position.id}/close`, {}, {
      onSuccess: () => {
        toast({
          title: "Position Closed",
          description: "The position has been successfully closed."
        });
      },
      onError: (errors: Record<string, string>) => {
        console.error('Failed to close position:', errors);
        toast({
          title: "Error Closing Position",
          description: Object.values(errors).join(', ') || "An unexpected error occurred.",
          variant: "destructive"
        });
      },
    });
  };

  const handleCancelOrder = (orderId: string | number) => {
    router.delete(route('trading.orders.destroy', orderId), {
      preserveScroll: true, // Keep scroll position
      onSuccess: () => {
        toast({ title: "Order Cancelled", description: "The pending order has been cancelled." });
      },
      onError: (errors: Record<string, string>) => {
        console.error("Cancel order error:", errors);
        const errorMessages = Object.values(errors).join(' ');
        toast({ title: "Cancellation Error", description: errorMessages || "Failed to cancel order.", variant: "destructive" });
      },
    });
  };

  const toggleTradingMode = async () => {
    try {
      const response = await axios.post<{ success: boolean; message: string }>('/trading/toggle-mode');
      
      if (response.data.success) {
        // Update the account information with the new mode
        // Since we can't use setAccount, we'll reload the page to get the updated account info
        toast({
          title: "Success",
          description: "Trading mode updated successfully"
        });
        
        // Reload the page to get the updated account info
        setTimeout(() => {
          router.reload();
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to update trading mode"
        });
      }
    } catch (error) {
      console.error('Error toggling trading mode:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating trading mode"
      });
    }
  };

  const getPairOptions = useCallback((): Array<{ value: string; label: string }> => {
    if (!availablePairs) return [];
    
    // Define interfaces for our currency pair objects
    interface CurrencyPairObject {
      id?: number | string;
      symbol: string;
    }
    
    type PairType = string | CurrencyPairObject | unknown;
    
    // Helper function to safely convert a pair (string or object) into an option object
    const pairToOption = (pair: PairType) => {
      // Check if pair is an object with a symbol property
      if (pair && typeof pair === 'object' && 'symbol' in pair) {
        const pairObj = pair as CurrencyPairObject;
        return { value: String(pairObj.symbol), label: String(pairObj.symbol) };
      }
      // Fallback for string pairs (though it seems all pairs are objects)
      if (typeof pair === 'string') {
        return { value: pair, label: pair };
      }
      // Log and return a placeholder for invalid pairs
      console.warn('Invalid pair:', pair);
      return { value: '', label: 'Invalid Pair' };
    };
    
    // Process each category of pairs
    const forexPairs = Array.isArray(availablePairs.forex) 
      ? availablePairs.forex.map(pairToOption) 
      : [];
    
    const cryptoPairs = Array.isArray(availablePairs.crypto) 
      ? availablePairs.crypto.map(pairToOption) 
      : [];
    
    const commodityPairs = Array.isArray(availablePairs.commodities) 
      ? availablePairs.commodities.map(pairToOption) 
      : [];
    
    const indicesPairs = Array.isArray(availablePairs.indices) 
      ? availablePairs.indices.map(pairToOption) 
      : [];
    
    // Combine all pairs
    const result = [...forexPairs, ...cryptoPairs, ...commodityPairs, ...indicesPairs];
    return result;
  }, [availablePairs]);

  const fetchHistoricalData = async (pairSymbol: string, timeframe: string, count: number = 200): Promise<CandleData[]> => {
    console.log(`Fetching data for ${pairSymbol}, timeframe: ${timeframe}, count: ${count}`);
    // In a real app, fetch data from an API endpoint
    // For now, generate mock data:
    const data: CandleData[] = [];
    let lastClose = 1.10000 + (Math.random() - 0.5) * 0.1; // Start with some variation
    const timeframeMs = 60 * 60 * 1000; // Use the helper
    let currentTime = new Date().getTime() - count * timeframeMs;

    for (let i = 0; i < count; i++) {
      const open = lastClose;
      const high = open + Math.random() * 0.00100;
      const low = open - Math.random() * 0.00100;
      const close = low + Math.random() * (high - low);
      // const volume = Math.random() * 10000 + 5000; // Volume not used by chart's tuple
      data.push({
        x: new Date(currentTime),
        y: [open, high, low, close], // Ensure y is the tuple [open, high, low, close]
        pair: pairSymbol
      });
      lastClose = close;
      currentTime += timeframeMs;
    }
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Returning ${data.length} data points.`);
    return data;
  };

  return (
    <AppLayout>
      <Head title="Trading">
      </Head>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {account.mode === 'DEMO' ? 'Demo Account' : 'Live Account'}
                </p>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={account.mode === 'LIVE'}
                      onCheckedChange={toggleTradingMode}
                      id="demo-mode-toggle"
                      className={`${
                        account.mode === 'LIVE' ? 'bg-[#8D5EB7]' : 'bg-gray-400'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 bg-input hover:bg-accent cursor-pointer`
                    }
                    >
                      <span
                        className={`${
                          account.mode === 'LIVE' ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                    <span className="text-sm font-medium">
                      {account.mode === 'DEMO' ? 'Demo Trading' : 'Live Trading'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(account.available_margin)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Leverage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{account.leverage}x</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Risk Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{account.risk_percentage}%</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trading Chart Card */}
          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trading Chart</CardTitle>
              <div className="flex space-x-2">
                <SimpleSelect 
                  id="chart-pair-select"
                  value={selectedPair} 
                  onChange={(value: string) => {
                    setSelectedPair(value);
                  }}
                  options={getPairOptions()}
                />
                
                <SimpleSelect 
                  id="chart-timeframe-select"
                  value={selectedTimeframe} 
                  onChange={(value: string) => {
                    setSelectedTimeframe(value);
                  }}
                  options={[
                    { value: '1m', label: '1 Minute' },
                    { value: '5m', label: '5 Minutes' },
                    { value: '15m', label: '15 Minutes' },
                    { value: '30m', label: '30 Minutes' },
                    { value: '1h', label: '1 Hour' },
                    { value: '4h', label: '4 Hours' },
                    { value: '1d', label: '1 Day' },
                    { value: '1w', label: '1 Week' },
                  ]}
                />
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="predictive-mode" className="cursor-pointer">
                    <span className={predictiveMode ? "text-purple-500 font-medium" : ""}>
                      Predictive Mode
                    </span>
                  </Label>
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 bg-input hover:bg-accent cursor-pointer"
                    onClick={() => setPredictiveMode(!predictiveMode)}
                  >
                    <span className={`${predictiveMode ? "translate-x-6 bg-purple-500" : "translate-x-1 bg-foreground"} inline-block h-4 w-4 rounded-full transition-transform`} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
            <TradingChart
    pairSymbol={selectedPair} // Changed from pairId to pairSymbol
    timeframe={selectedTimeframe}
    predictiveMode={predictiveMode} // Pass the predictiveMode state
    historicalDataFn={fetchHistoricalData} // Pass the defined function
/>
            </CardContent>
          </Card>

          {/* Market Overview Card */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="forex" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="forex">Forex</TabsTrigger>
                  <TabsTrigger value="crypto">Crypto</TabsTrigger>
                  <TabsTrigger value="indices">Indices</TabsTrigger>
                </TabsList>
                <TabsContent value="forex">
                  <MarketDataTable data={marketOverview.forex} />
                </TabsContent>
                <TabsContent value="crypto">
                  <MarketDataTable data={marketOverview.crypto} />
                </TabsContent>
                <TabsContent value="indices">
                  <MarketDataTable data={marketOverview.indices} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Open Positions Card */}
          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow key="positions-header">
                    <TableHead key="pos-currency-pair">Currency Pair</TableHead>
                    <TableHead key="pos-type">Type</TableHead>
                    <TableHead key="pos-quantity">Quantity</TableHead>
                    <TableHead key="pos-entry-price">Entry Price</TableHead>
                    <TableHead key="pos-current-price">Current Price</TableHead>
                    <TableHead key="pos-pl">P/L</TableHead>
                    <TableHead key="pos-pl-percent">P/L %</TableHead>
                    <TableHead key="pos-actions">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.length === 0 ? (
                    <TableRow key="no-positions">
                      <TableCell colSpan={8} className="text-center">No open positions</TableCell>
                    </TableRow>
                  ) : (
                    positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell key={`pos-pair-${position.id}`}>{position.currency_pair}</TableCell>
                        <TableCell key={`pos-type-${position.id}`} className={position.trade_type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                          {position.trade_type || position.type}
                        </TableCell>
                        <TableCell key={`pos-qty-${position.id}`}>{position.quantity || position.amount}</TableCell>
                        <TableCell key={`pos-entry-${position.id}`}>{(position.entry_price || position.open_price) ? formatCurrency(position.entry_price || position.open_price) : '$0.00'}</TableCell>
                        <TableCell key={`pos-current-${position.id}`}>{
                          currentPrices[position.currency_pair]?.price 
                            ? formatCurrency(currentPrices[position.currency_pair].price) 
                            : ((position.entry_price || position.open_price) ? formatCurrency(position.entry_price || position.open_price) : '$0.00')
                        }</TableCell>
                        <TableCell key={`pos-pl-${position.id}`} className={
                          ((currentPrices[position.currency_pair]?.price || (position.entry_price || position.open_price) || 0) - ((position.entry_price || position.open_price) || 0)) >= 0 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }>
                          {formatCurrency(
                            ((currentPrices[position.currency_pair]?.price || (position.entry_price || position.open_price) || 0) - ((position.entry_price || position.open_price) || 0)) || 0
                          )}
                        </TableCell>
                        <TableCell key={`pos-pl-pct-${position.id}`} className={
                          ((currentPrices[position.currency_pair]?.price || (position.entry_price || position.open_price) || 0) - ((position.entry_price || position.open_price) || 0)) >= 0 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }>
                          {(() => {
                            const currentPrice = currentPrices[position.currency_pair]?.price || (position.entry_price || position.open_price) || 0;
                            const openPrice = (position.entry_price || position.open_price) || 1; // Avoid division by zero
                            const percentChange = ((currentPrice - openPrice) / openPrice) * 100;
                            return `${isNaN(percentChange) ? '0.00' : percentChange.toFixed(2)}%`;
                          })()}
                        </TableCell>
                        <TableCell key={`pos-actions-${position.id}`}>
                          <Button variant="outline" size="sm" onClick={() => handleClosePosition(position)}>
                            Close
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pending Orders Card */}
          <Card className="md:col-span-3"> {/* Full width on large screens */}
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingOrdersTable orders={pendingOrders} onCancelOrder={handleCancelOrder} />
            </CardContent>
          </Card>

          {/* Create Order Form Card */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Create New Order (Test)</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateOrderForm 
                toast={toast} 
                onClose={() => { /* Dummy close handler */ }}
              />
            </CardContent>
          </Card>

          {/* Market Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Forex</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketOverview.forex.map((item) => (
                        <TableRow key={item.symbol}>
                          <TableCell key={`forex-symbol-${item.symbol}`}>{item.symbol}</TableCell>
                          <TableCell key={`forex-price-${item.symbol}`}>{formatCurrency(item.price)}</TableCell>
                          <TableCell key={`forex-change-${item.symbol}`} className={item.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                            {item.change ?? 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Crypto</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketOverview.crypto.map((item) => (
                        <TableRow key={item.symbol}>
                          <TableCell key={`crypto-symbol-${item.symbol}`}>{item.symbol}</TableCell>
                          <TableCell key={`crypto-price-${item.symbol}`}>{formatCurrency(item.price)}</TableCell>
                          <TableCell key={`crypto-change-${item.symbol}`} className={item.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                            {item.change ?? 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Indices</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketOverview.indices.map((item) => (
                        <TableRow key={item.symbol}>
                          <TableCell key={`indices-symbol-${item.symbol}`}>{item.symbol}</TableCell>
                          <TableCell key={`indices-price-${item.symbol}`}>{formatCurrency(item.price)}</TableCell>
                          <TableCell key={`indices-change-${item.symbol}`} className={item.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                            {item.change ?? 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

// Helper component to render market data tables
const MarketDataTable: React.FC<{ data: MarketOverviewItem[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-4">No data available.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.symbol}>
            <TableCell className="font-medium">{item.symbol}</TableCell>
            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
            <TableCell className={`text-right ${item.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {item.change ?? 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Helper component to render pending orders table
const PendingOrdersTable: React.FC<{ orders: TradingOrder[], onCancelOrder: (orderId: string | number) => void }> = ({ orders, onCancelOrder }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Side</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.currency_pair}</TableCell>
            <TableCell>{order.order_type}</TableCell>
            <TableCell>{order.side}</TableCell>
            <TableCell className="text-right">{order.quantity.toLocaleString()}</TableCell>
            <TableCell className="text-right">{order.price ? order.price.toLocaleString() : 'Market'}</TableCell>
            <TableCell>{order.status}</TableCell>
            <TableCell className="text-right">
              <Button variant="destructive" size="sm" onClick={() => onCancelOrder(order.id)}>
                Cancel
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

interface CreateOrderFormProps {
  onClose: () => void;
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: "default" | "destructive" | null | undefined }) => void;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ 
  onClose, 
  toast 
}) => {
  // Debug log for props received
  console.log('DEBUG: CreateOrderForm received props:', {
  });

  // Use hardcoded currency pairs for now to get past the rendering errors
  const currencyPairs = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", 
    "USDCAD", "NZDUSD", "EURGBP", "EURJPY", "GBPJPY"
  ];

  const { data: formData, setData: setFormData, post, processing, errors, reset } = useForm<OrderFormData>({
    trading_wallet_id: null, // Initialize as null
    currency_pair: '', // Initialize as empty string
    order_type: 'MARKET',
    side: 'BUY',
    quantity: 0.01,
    entry_price: null,
    stop_loss: null,
    take_profit: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    if (type === 'number') {
      const numValue = value === '' ? null : parseFloat(value);
      setFormData(name as keyof OrderFormData, numValue);
    } else {
      setFormData(name as keyof OrderFormData, value);
    }
  };

  // Handle select changes (for dropdowns)
  const handleSelectChange = (name: keyof OrderFormData, value: string) => {
    setFormData(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currency_pair) {
      toast({ title: 'Error', description: 'Currency pair not selected.' });
      return;
    }
    
    if (!formData.side) {
      toast({ title: 'Error', description: 'Side not selected.' });
      return;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      toast({ title: 'Error', description: 'Invalid quantity.' });
      return;
    }
    
    if (formData.order_type === 'LIMIT' && (formData.entry_price === null || formData.entry_price <= 0)) {
      toast({ title: 'Error', description: 'Valid Entry Price is required for Limit orders.' });
      return;
    }
    
    // Submit the form
    // Cast to unknown first to satisfy TypeScript's type checking
    post(route('trading.orders.store'), {
      onSuccess: () => {
        toast({ title: 'Order Submitted', description: 'Your order has been placed.' });
        reset();
        onClose();
      },
      onError: (errors) => {
        console.error('Failed to submit order:', errors);
        toast({ title: 'Error', description: 'Failed to submit order. Check console for details.' });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="currency_pair">Currency Pair</Label>
        <Select
          value={formData.currency_pair}
          onValueChange={(value) => handleSelectChange('currency_pair', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency pair" />
          </SelectTrigger>
          <SelectContent>
            {currencyPairs.length > 0 ? (
              // Use simple string array with index-based keys
              currencyPairs.map((pair, index) => (
                <SelectItem key={`pair-${index}`} value={pair}>
                  {pair}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>No pairs available</SelectItem>
            )}
          </SelectContent>
        </Select>
        {errors.currency_pair && <p className="text-red-500 text-xs mt-1">{errors.currency_pair}</p>}
      </div>

      <div>
        <Label htmlFor="side">Side</Label>
        <Select
          value={formData.side}
          onValueChange={(value) => handleSelectChange('side', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select side" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BUY">Buy</SelectItem>
            <SelectItem value="SELL">Sell</SelectItem>
          </SelectContent>
        </Select>
        {errors.side && <p className="text-red-500 text-xs mt-1">{errors.side}</p>}
      </div>

      <div>
        <Label htmlFor="order_type">Order Type</Label>
        <Select
          value={formData.order_type}
          onValueChange={(value) => handleSelectChange('order_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select order type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MARKET">Market</SelectItem>
            <SelectItem value="LIMIT">Limit</SelectItem>
          </SelectContent>
        </Select>
        {errors.order_type && <p className="text-red-500 text-xs mt-1">{errors.order_type}</p>}
      </div>

      {formData.order_type === 'LIMIT' && (
        <div>
          <Label htmlFor="entry_price">Entry Price</Label>
          <Input
            id="entry_price"
            name="entry_price"
            type="number"
            step="0.00001"
            min="0.00001"
            value={formData.entry_price ?? ''}
            onChange={handleChange}
            required
            placeholder="Enter desired entry price"
            className="mt-1"
          />
          {errors.entry_price && <p className="text-red-500 text-xs mt-1">{errors.entry_price}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input id="quantity" name="quantity" type="number" step="0.01" min="0.01" value={formData.quantity} onChange={handleChange} required className="mt-1" />
        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
      </div>

      <div>
        <Label htmlFor="stop_loss">Stop Loss</Label>
        <Input id="stop_loss" name="stop_loss" type="number" step="any" value={formData.stop_loss ?? ''} onChange={handleChange} placeholder="Optional stop price" className="mt-1" />
        {errors.stop_loss && <p className="text-red-500 text-xs mt-1">{errors.stop_loss}</p>}
      </div>

      <div>
        <Label htmlFor="take_profit">Take Profit</Label>
        <Input id="take_profit" name="take_profit" type="number" step="any" value={formData.take_profit ?? ''} onChange={handleChange} placeholder="Optional profit target" className="mt-1" />
        {errors.take_profit && <p className="text-red-500 text-xs mt-1">{errors.take_profit}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={processing}>
        {processing ? 'Submitting...' : 'Submit Order'}
      </Button>
    </form>
  );
};

export default Trading;
