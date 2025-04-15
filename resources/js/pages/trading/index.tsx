import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '../../layouts/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '../../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { useAppearance } from '../../hooks/use-appearance';
import { Switch } from '../../components/ui/switch';
import { useToast } from "../../components/ui/use-toast";
import TradingChart from '../../components/trading/trading-chart';
import { CurrencyPair } from '../../types/currency-pair'; // Use relative path

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

interface Order {
  id: number;
  currency_pair: string;
  trade_type: string;
  quantity: number;
  price: number;
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

interface MarketItem {
  symbol: string;
  price: number;
  change_24h: number | null;
  volume_24h: number | null;
}

interface MarketOverview {
  indices: MarketItem[];
  forex: MarketItem[];
  crypto: MarketItem[];
}

interface AvailablePairs {
  forex: { id: number; symbol: string }[];
  crypto: { id: number; symbol: string }[];
  commodities: { id: number; symbol: string }[];
  indices: { id: number; symbol: string }[];
}

interface TradingProps {
  positions?: Position[];
  orders?: Order[];
  account?: Account;
  marketOverview?: MarketOverview;
  availablePairs?: AvailablePairs;
}

interface CurrentPrice {
  price: number;
  timestamp: string;
  symbol?: string;
  change?: number;
  change_percent?: number;
}

interface PositionFormData {
  currency_pair: string;
  trade_type: string;
  quantity: number;
  stop_loss: number | null;
  take_profit: number | null;
}

interface CandleData {
  x: Date;
  y: [number, number, number, number]; // [open, high, low, close]
  pair?: string;
}

interface HistoricalDataItem {
  timestamp: number; // Changed from date: string
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number; // Volume might be optional
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

const Trading = ({ 
  positions = [], 
  orders = [], 
  account = { balance: 0, available_margin: 0, leverage: 0, risk_percentage: 0, mode: 'DEMO' },
  marketOverview = { indices: [], forex: [], crypto: [] },
  availablePairs = { forex: [], crypto: [], commodities: [], indices: [] }
}: TradingProps) => {
  const [localPositions, setLocalPositions] = useState<Position[]>(positions);
  // We keep setLocalOrders for future use when implementing order cancellation
  const [localOrders] = useState<Order[]>(orders);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isClosePositionOpen, setIsClosePositionOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<Record<string, CurrentPrice>>({});
  const [formData, setFormData] = useState<PositionFormData>({
    currency_pair: '',
    trade_type: 'BUY',
    quantity: 0,
    stop_loss: null,
    take_profit: null,
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');
  const [selectedPair, setSelectedPair] = useState<string>(''); // Start empty string
  const [details, setDetails] = useState<CurrencyPair | null>(null); // Initialize details to null
  const [predictiveMode, setPredictiveMode] = useState(false);
  
  const { appearance } = useAppearance();
  const { toast } = useToast();
  
  // Helper function to generate fallback prices (extracted logic)
  const generateFallbackPrices = useCallback(() => {
    console.log('Generating fallback/mock prices.');
    const fallbackPrices: Record<string, CurrentPrice> = {};
    const basePrices: Record<string, number> = {
      'EUR/USD': 1.0876,
      'USD/JPY': 151.62,
      'GBP/USD': 1.2542,
      'USD/CHF': 0.9042,
      'AUD/USD': 0.6614,
      'USD/CAD': 1.3614,
      'NZD/USD': 0.6014,
    };

    const basePrice = basePrices[selectedPair] || 1.0;
    const randomVariation = (Math.random() * 0.02) - 0.01;
    fallbackPrices[selectedPair] = {
      price: basePrice * (1 + randomVariation),
      timestamp: new Date().toISOString()
    };

    localPositions.forEach(position => {
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
  }, [selectedPair, localPositions]); // Dependencies for generateFallbackPrices

  // Fetch current prices function
  const fetchCurrentPrices = useCallback(async () => {
    // Only fetch if a pair is selected
    if (!selectedPair) {
      console.log('No pair selected, skipping price fetch');
      return;
    }
    
    try {
      // Use the selectedPair ID directly (not as part of a path segment)
      const response = await axios.get(`/api/market-data/current/${selectedPair}`);
      
      if (response.data && response.data.current) {
        // Process current price data
        setCurrentPrices(response.data.current);
      } else {
        console.warn('Invalid response format for current prices');
      }
    } catch (error) {
      console.error('Failed to fetch current prices:', error);
      // Generate fallback prices only if needed
      console.log('Generating fallback/mock prices.');
      generateFallbackPrices();
    }
  }, [selectedPair, generateFallbackPrices]); // Add selectedPair and generateFallbackPrices as dependencies

  // Set up axios defaults and initialize
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    if (csrfToken) {
      axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    } else {
      console.warn('CSRF token not found in meta tags');
    }
    
    const initCsrf = async () => {
      try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF cookie initialized successfully');
        
        // Only fetch prices if a pair is selected
        if (selectedPair) {
          fetchCurrentPrices();
        }
      } catch (error) {
        console.error('Error initializing CSRF:', error);
      }
    };
    
    initCsrf();
    
    // Set up interval but only fetch if selectedPair exists
    const interval = setInterval(() => {
      if (selectedPair) {
        fetchCurrentPrices();
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [fetchCurrentPrices, selectedPair]); // Add selectedPair as dependency
  
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
  
  const handleAddPosition = () => {
    setIsAddPositionOpen(true);
  };
  
  const handleClosePosition = (position: Position) => {
    setSelectedPosition(position);
    setIsClosePositionOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'stop_loss' || name === 'take_profit') {
      setFormData({
        ...formData,
        [name]: value === '' ? null : Number(value)
      });
    } else if (name === 'quantity') {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleTradeTypeChange = (value: string) => {
    setFormData({
      ...formData,
      trade_type: value
    });
  };
  
  const handleCurrencyPairChange = (value: string) => {
    setFormData({
      ...formData,
      currency_pair: value
    });
  };
  
  const handleAddPositionSubmit = async () => {
    setIsLoading(true);
    try {
      router.post('/trading', {
        currency_pair: formData.currency_pair,
        order_type: 'MARKET',
        side: formData.trade_type,
        quantity: formData.quantity,
        price: null,
        stop_loss: formData.stop_loss,
        take_profit: formData.take_profit,
        time_in_force: 'GTC',
      }, {
        onSuccess: () => {
          fetchPositions();
          
          closeAddPositionDialog();
          setFormData({
            currency_pair: '',
            trade_type: 'BUY',
            quantity: 0,
            stop_loss: null,
            take_profit: null,
          });
        },
        onError: (errors) => {
          console.error('Failed to add position:', errors);
        },
        onFinish: () => {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Failed to add position:', error);
      setIsLoading(false);
    }
  };
  
  const fetchPositions = async () => {
    try {
      const response = await axios.get('/trading');
      if (response.data && response.data.positions) {
        setLocalPositions(response.data.positions);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };
  
  const closePosition = async () => {
    if (!selectedPosition) return;
    
    setIsLoading(true);
    try {
      router.post(`/trading/positions/${selectedPosition.id}/close`, {}, {
        onSuccess: () => {
          setLocalPositions(localPositions.filter(p => p.id !== selectedPosition.id));
          closeClosePositionDialog();
          setSelectedPosition(null);
        },
        onError: (errors) => {
          console.error('Failed to close position:', errors);
        },
        onFinish: () => {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Failed to close position:', error);
      setIsLoading(false);
    }
  };

  const closeAddPositionDialog = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsAddPositionOpen(false);
  };

  const closeClosePositionDialog = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsClosePositionOpen(false);
  };

  const toggleTradingMode = async () => {
    try {
      const response = await axios.post('/trading/toggle-mode');
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Trading mode updated successfully"
        });
        
        setTimeout(() => {
          router.reload();
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to update trading mode",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error toggling trading mode:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating trading mode",
        variant: "destructive"
      });
    }
  };

  const fetchHistoricalData = useCallback(async (pairId: number, timeframe: string, count: number = 200): Promise<CandleData[]> => {
    console.log('[TradingPage] fetchHistoricalData called with:', { pairId, timeframe }); // <-- Log entry & params
    console.log('[TradingPage] Attempting axios.get for historical data...'); // <-- Log before axios call
    try {
      // Ensure CSRF token is initialized before making the request
      await axios.get('/sanctum/csrf-cookie');

      const response = await axios.get('/trading/historical-data', {
        params: {
          currency_pair: pairId,
          timeframe: timeframe,
          count: count
        }
      });

      console.log('Raw API Historical Data:', response.data); // <-- Log raw data

      // Adjust to handle the new response structure { historical: [], predictive: {} }
      if (response.data && response.data.historical && Array.isArray(response.data.historical)) {
        // Transform the historical data array
        const historicalData = response.data.historical;
        const transformedData: CandleData[] = historicalData.map((item: HistoricalDataItem) => ({
          x: new Date(item.timestamp), // Use item.timestamp directly
          y: [
            item.open,
            item.high,
            item.low,
            item.close
          ] as [number, number, number, number], // Ensure it's a 4-element tuple
          pair: pairId
        }));
        console.log(`Received and transformed ${transformedData.length} data points.`);
        return transformedData;
      } else {
        console.error('Invalid data format received from API:', response.data);
        toast({
          title: "Chart Error",
          description: "Received invalid data format for chart. Expected { historical: [...] }.",
          variant: "destructive",
        });
        return []; // Return empty array if data is not as expected
      }
    } catch (error: unknown) { // Changed from any to unknown
      console.error('Error fetching historical data:', error);
      let errorMessage = "Could not fetch chart data.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with a status code outside the 2xx range
          console.error('API Error Response:', error.response.data);
          errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        } else if (error.request) {
          // Request was made but no response received
          console.error('API No Response:', error.request);
          errorMessage = "No response from server. Check network connection.";
        } else {
          // Something happened in setting up the request
          console.error('API Request Setup Error:', error.message);
          errorMessage = `Error setting up request: ${error.message}`;
        }
      } else if (error instanceof Error) {
        // Handle non-Axios errors (e.g., errors during data transformation)
        console.error('Non-API Error:', error);
        errorMessage = error.message || 'An unexpected error occurred.';
      } else {
        console.error('Unknown Error:', error);
        errorMessage = 'An unknown error occurred.';
      }

      toast({
        title: "Chart Data Error",
        description: errorMessage,
        variant: "destructive",
      });
      return []; // Return empty array on error
    }
  }, [toast]); // Added toast dependency

  useEffect(() => {
    if (selectedPair) {
      const fetchDetails = async () => {
        try {
          // Use the selectedPair ID directly (not as part of a path segment)
          const response = await axios.get(`/api/currency-pairs/${selectedPair}`);
          setDetails(response.data); // <-- Call setDetails here
        } catch (error: unknown) { // <-- Use unknown
          console.error(`Error fetching details for pair ${selectedPair}:`, error);
          setDetails(null); // Reset details on error
          // Add toast notification for fetch details error
          toast({
            title: "Error",
            description: `Failed to fetch details: ${error instanceof Error ? error.message : 'Unknown error'}`, // <-- Type check
            variant: "destructive",
          });
        }
      };
      fetchDetails();
    }
  }, [selectedPair, toast]); // <-- Added toast dependency
 
  return (
    <AppLayout>
      <Head title="Trading">
      </Head>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <Button onClick={handleAddPosition}>Add Position</Button>
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
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#211DE49] focus:ring-offset-2`}
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
                <Select 
                  value={selectedPair} 
                  onValueChange={(value) => {
                    setSelectedPair(value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePairs && availablePairs.crypto && availablePairs.crypto.map((pair) => (
                      <SelectItem key={pair.id} value={String(pair.id)}>
                        {pair.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedTimeframe} 
                  onValueChange={(value) => {
                    setSelectedTimeframe(value);
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="timeframe-1m" value="1m">1 Minute</SelectItem>
                    <SelectItem key="timeframe-5m" value="5m">5 Minutes</SelectItem>
                    <SelectItem key="timeframe-15m" value="15m">15 Minutes</SelectItem>
                    <SelectItem key="timeframe-30m" value="30m">30 Minutes</SelectItem>
                    <SelectItem key="timeframe-1h" value="1h">1 Hour</SelectItem>
                    <SelectItem key="timeframe-4h" value="4h">4 Hours</SelectItem>
                    <SelectItem key="timeframe-1d" value="1d">1 Day</SelectItem>
                    <SelectItem key="timeframe-1w" value="1w">1 Week</SelectItem>
                  </SelectContent>
                </Select>
                
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
            <CardContent className="h-[500px] p-0 overflow-hidden pb-4">
              {/* Conditionally render TradingChart */}
              {selectedPair && details ? (
                <TradingChart
                  pairId={parseInt(selectedPair, 10)} // Convert string pairId to number
                  timeframe={selectedTimeframe}
                  currencyPair={details} // Corrected: Pass the details object
                  historicalDataFn={fetchHistoricalData} // Pass the defined function
                  predictiveMode={predictiveMode}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Select a currency pair to view the chart.</p>
                  {/* Or use a Skeleton loader */}
                  {/* <Skeleton className="w-full h-full" /> */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Positions Card */}
          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
              <Button size="sm" onClick={handleAddPosition}>Add Position</Button>
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
                  {localPositions.length === 0 ? (
                    <TableRow key="no-positions">
                      <TableCell colSpan={8} className="text-center">No open positions</TableCell>
                    </TableRow>
                  ) : (
                    localPositions.map((position, index) => (
                      <TableRow key={position.id}>
                        <TableCell key={`pos-pair-${index}`}>{position.currency_pair}</TableCell>
                        <TableCell key={`pos-type-${index}`} className={position.trade_type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                          {position.trade_type || position.type}
                        </TableCell>
                        <TableCell key={`pos-qty-${index}`}>{position.quantity || position.amount}</TableCell>
                        <TableCell key={`pos-entry-${index}`}>{(position.entry_price || position.open_price) ? formatCurrency(position.entry_price || position.open_price) : '$0.00'}</TableCell>
                        <TableCell key={`pos-current-${index}`}>{
                          currentPrices[position.currency_pair]?.price 
                            ? formatCurrency(currentPrices[position.currency_pair].price) 
                            : ((position.entry_price || position.open_price) ? formatCurrency(position.entry_price || position.open_price) : '$0.00')
                        }</TableCell>
                        <TableCell key={`pos-pl-${index}`} className={
                          ((currentPrices[position.currency_pair]?.price || (position.entry_price || position.open_price) || 0) - ((position.entry_price || position.open_price) || 0)) >= 0 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }>
                          {formatCurrency(
                            ((currentPrices[position.currency_pair]?.price || (position.entry_price || position.open_price) || 0) - ((position.entry_price || position.open_price) || 0)) || 0
                          )}
                        </TableCell>
                        <TableCell key={`pos-pl-pct-${index}`} className={
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
                        <TableCell key={`pos-actions-${index}`}>
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
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow key="orders-header">
                    <TableHead key="order-currency-pair">Currency Pair</TableHead>
                    <TableHead key="order-type">Type</TableHead>
                    <TableHead key="order-quantity">Quantity</TableHead>
                    <TableHead key="order-price">Price</TableHead>
                    <TableHead key="order-status">Status</TableHead>
                    <TableHead key="order-created-at">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localOrders.length === 0 ? (
                    <TableRow key="no-orders">
                      <TableCell colSpan={6} className="text-center">No pending orders</TableCell>
                    </TableRow>
                  ) : (
                    localOrders.map((order, index) => (
                      <TableRow key={order.id}>
                        <TableCell key={`order-pair-${index}`}>{order.currency_pair}</TableCell>
                        <TableCell key={`order-type-${index}`} className={order.trade_type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                          {order.trade_type}
                        </TableCell>
                        <TableCell key={`order-qty-${index}`}>{order.quantity}</TableCell>
                        <TableCell key={`order-price-${index}`}>{formatCurrency(order.price)}</TableCell>
                        <TableCell key={`order-status-${index}`}>{order.status}</TableCell>
                        <TableCell key={`order-created-${index}`}>{new Date(order.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
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
                    <TableRow key="forex-header">
                      <TableHead key="forex-symbol">Symbol</TableHead>
                      <TableHead key="forex-price">Price</TableHead>
                      <TableHead key="forex-change">24h Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketOverview.forex.map((item, index) => (
                      <TableRow key={`forex-${item.symbol}-${index}`}>
                        <TableCell key={`forex-symbol-${index}`}>{item.symbol}</TableCell>
                        <TableCell key={`forex-price-${index}`}>{formatCurrency(item.price)}</TableCell>
                        <TableCell key={`forex-change-${index}`} className={(item.change_24h !== null && item.change_24h !== undefined && item.change_24h >= 0) ? 'text-green-500' : 'text-red-500'}>
                          {(item.change_24h !== null && item.change_24h !== undefined) ? `${item.change_24h.toFixed(2)}%` : 'N/A'}
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
                    <TableRow key="crypto-header">
                      <TableHead key="crypto-symbol">Symbol</TableHead>
                      <TableHead key="crypto-price">Price</TableHead>
                      <TableHead key="crypto-change">24h Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketOverview.crypto.map((item, index) => (
                      <TableRow key={`crypto-${item.symbol}-${index}`}>
                        <TableCell key={`crypto-symbol-${index}`}>{item.symbol}</TableCell>
                        <TableCell key={`crypto-price-${index}`}>{formatCurrency(item.price)}</TableCell>
                        <TableCell key={`crypto-change-${index}`} className={(item.change_24h !== null && item.change_24h !== undefined && item.change_24h >= 0) ? 'text-green-500' : 'text-red-500'}>
                          {(item.change_24h !== null && item.change_24h !== undefined) ? `${item.change_24h.toFixed(2)}%` : 'N/A'}
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
                    <TableRow key="indices-header">
                      <TableHead key="indices-symbol">Symbol</TableHead>
                      <TableHead key="indices-price">Price</TableHead>
                      <TableHead key="indices-change">24h Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketOverview.indices.map((item, index) => (
                      <TableRow key={`indices-${item.symbol}-${index}`}>
                        <TableCell key={`indices-symbol-${index}`}>{item.symbol}</TableCell>
                        <TableCell key={`indices-price-${index}`}>{formatCurrency(item.price)}</TableCell>
                        <TableCell key={`indices-change-${index}`} className={(item.change_24h !== null && item.change_24h !== undefined && item.change_24h >= 0) ? 'text-green-500' : 'text-red-500'}>
                          {(item.change_24h !== null && item.change_24h !== undefined) ? `${item.change_24h.toFixed(2)}%` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Add Position Dialog */}
        <Dialog open={isAddPositionOpen} onOpenChange={(open) => {
          if (!open) closeAddPositionDialog();
          else setIsAddPositionOpen(true);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Position</DialogTitle>
              <DialogDescription>
                Enter the details for your new trading position.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency_pair">Currency Pair</Label>
                <Select value={formData.currency_pair} onValueChange={handleCurrencyPairChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePairs && availablePairs.crypto && availablePairs.crypto.map((pair) => (
                      <SelectItem key={pair.id} value={String(pair.id)}>
                        {pair.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="trade_type">Trade Type</Label>
                <Select value={formData.trade_type} onValueChange={handleTradeTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="trade-type-buy" value="BUY">Buy (Long)</SelectItem>
                    <SelectItem key="trade-type-sell" value="SELL">Sell (Short)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity || ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div>
                <Label htmlFor="stop_loss">Stop Loss (optional)</Label>
                <Input
                  id="stop_loss"
                  name="stop_loss"
                  type="number"
                  value={formData.stop_loss || ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div>
                <Label htmlFor="take_profit">Take Profit (optional)</Label>
                <Input
                  id="take_profit"
                  name="take_profit"
                  type="number"
                  value={formData.take_profit || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={closeAddPositionDialog}>
                Cancel
              </Button>
              <Button onClick={handleAddPositionSubmit} disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Position'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Close Position Dialog */}
        <Dialog open={isClosePositionOpen} onOpenChange={(open) => {
          if (!open) closeClosePositionDialog();
          else setIsClosePositionOpen(true);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Position</DialogTitle>
              <DialogDescription>
                Are you sure you want to close this position?
              </DialogDescription>
            </DialogHeader>
            
            {selectedPosition && (
              <div className="space-y-2">
                <p><strong>Currency Pair:</strong> {selectedPosition.currency_pair}</p>
                <p><strong>Type:</strong> {selectedPosition.trade_type || selectedPosition.type}</p>
                <p><strong>Quantity:</strong> {selectedPosition.quantity || selectedPosition.amount || 0}</p>
                <p><strong>Entry Price:</strong> {formatCurrency(selectedPosition.entry_price || selectedPosition.open_price || 0)}</p>
                <p><strong>Current Price:</strong> {formatCurrency(currentPrices[selectedPosition.currency_pair]?.price || 0)}</p>
                <p><strong>Profit/Loss:</strong> {(() => {
                  const currentPrice = currentPrices[selectedPosition.currency_pair]?.price || 0;
                  const openPrice = (selectedPosition.entry_price || selectedPosition.open_price || 0);
                  const priceDiff = currentPrice - openPrice;
                  const percentChange = openPrice !== 0 ? (priceDiff / openPrice) * 100 : 0;
                  return `${formatCurrency(priceDiff)} (${percentChange.toFixed(2)}%)`;
                })()}</p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={closeClosePositionDialog}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={closePosition} disabled={isLoading}>
                {isLoading ? 'Closing...' : 'Close Position'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Trading;
