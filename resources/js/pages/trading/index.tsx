import React, { useState, useEffect, useRef, useCallback } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import AppLayout from '@/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppearance } from '@/hooks/use-appearance';
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import TradingChart from '@/components/trading/trading-chart';

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
  forex: string[];
  crypto: string[];
  commodities: string[];
  indices: string[];
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

interface SimpleSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

// Define types for Inertia router
interface InertiaFormData {
  [key: string]: string | number | boolean | null | undefined;
}

interface CurrencyPair {
  symbol: string;
  description?: string; // Optional as sometimes it might just be the symbol string
}

type PairInput = string | CurrencyPair;

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

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  id,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  options,
  disabled = false
}) => {
  return (
    <select
      id={id}
      className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {value === "" && <option key="placeholder" value="" disabled>{placeholder}</option>}
      {options.map((option, index) => (
        <option key={`${option.value}-${index}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const Trading = ({ 
  positions = [], 
  orders = [], 
  account = { balance: 0, available_margin: 0, leverage: 0, risk_percentage: 0, mode: 'DEMO' },
  marketOverview = { indices: [], forex: [], crypto: [] },
  availablePairs = { forex: [], crypto: [], commodities: [], indices: [] }
}: TradingProps) => {
  const { props } = usePage();
  const { flash } = props as unknown as { flash: { success?: string; error?: string } }; // Type assertion for flash
  const { toast } = useToast();

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
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
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

  const handleAddPosition = () => {
    setIsAddPositionOpen(true);
  };
  
  const handleClosePosition = (position: Position) => {
    setSelectedPosition(position);
    setIsClosePositionOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle different field types appropriately
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
  
  const handleAddPositionSubmit = () => {
    setIsLoading(true);
    
    // Validate form data
    if (!formData.currency_pair) {
      toast({
        title: "Validation Error",
        description: "Please select a currency pair.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    if (!formData.trade_type) {
      toast({
        title: "Validation Error",
        description: "Please select a trade type.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Submit the form
    // Cast to unknown first to satisfy TypeScript's type checking
    router.post("/trading/positions", formData as unknown as InertiaFormData, {
      onSuccess: () => {
        toast({
          title: "Position Added",
          description: "Your position has been added successfully.",
        });
        
        // Reset form data
        setFormData({
          currency_pair: '',
          trade_type: 'BUY',
          quantity: 0,
          stop_loss: null,
          take_profit: null,
        });
        
        closeAddPositionDialog();
      },
      onError: (errors: Record<string, string>) => {
        console.error('Failed to add position:', errors);
        toast({
          title: "Error Adding Position",
          description: Object.values(errors).join(', ') || "An unexpected error occurred.",
          variant: "destructive",
        });
      },
      onFinish: () => {
        setIsLoading(false);
      }
    });
  };
  
  const closePosition = () => {
    if (!selectedPosition) return;
    
    setIsLoading(true);
    
    router.post(`/trading/positions/${selectedPosition.id}/close`, {}, {
      onSuccess: () => {
        toast({
          title: "Position Closed",
          description: "Your position has been closed successfully.",
        });
        
        closeClosePositionDialog();
        setSelectedPosition(null);
      },
      onError: (errors: Record<string, string>) => {
        console.error('Failed to close position:', errors);
        toast({
          title: "Error Closing Position",
          description: Object.values(errors).join(', ') || "An unexpected error occurred.",
          variant: "destructive",
        });
      },
      onFinish: () => {
        setIsLoading(false);
      }
    });
  };

  const closeAddPositionDialog = () => {
    // Ensure we clear focus before closing the dialog
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Add a small delay to ensure focus is properly cleared
    setTimeout(() => {
      setIsAddPositionOpen(false);
    }, 10);
  };

  const closeClosePositionDialog = () => {
    setIsClosePositionOpen(false);
  };

  // Function to toggle between demo and live trading modes
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

  // Helper function to convert availablePairs to options array
  const getPairOptions = useCallback((): Array<{ value: string; label: string }> => {
    if (!availablePairs) return [];
    
    // Helper function to safely convert a pair (string or object) into an option object
    const pairToOption = (pair: PairInput) => {
      if (typeof pair === 'string') {
        return { value: pair, label: pair };
      } else if (pair && typeof pair === 'object' && pair.symbol) {
        return { value: pair.symbol, label: `${pair.symbol} - ${pair.description || ''}`.trim() };
      }
      // Handle unexpected types gracefully, though ideally the input should always match PairInput
      console.warn('Unexpected pair type:', pair);
      return { value: 'unknown', label: 'Unknown Pair' };
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
    return [...forexPairs, ...cryptoPairs, ...commodityPairs, ...indicesPairs];
  }, [availablePairs]);

  const addPositionDialogContentRef = useRef<HTMLDivElement>(null); // Ref for Add Position Dialog Content
  const closePositionDialogContentRef = useRef<HTMLDivElement>(null); // Ref for Close Position Dialog Content

  useEffect(() => {
    if (availablePairs) {
      console.log('Available pairs:', availablePairs);
    }
  }, [availablePairs]);

  useEffect(() => {
    if (availablePairs) {
      console.log('Available pairs structure:', JSON.stringify(availablePairs, null, 2));
    }
  }, [availablePairs]);

  // Define fetchHistoricalData function
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
                  onChange={(value) => {
                    setSelectedPair(value);
                  }}
                  options={getPairOptions()}
                />
                
                <SimpleSelect 
                  id="chart-timeframe-select"
                  value={selectedTimeframe} 
                  onChange={(value) => {
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
                  {positions.length === 0 ? (
                    <TableRow key="no-positions">
                      <TableCell colSpan={8} className="text-center">No open positions</TableCell>
                    </TableRow>
                  ) : (
                    positions.map((position, index) => (
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
                  {orders.length === 0 ? (
                    <TableRow key="no-orders">
                      <TableCell colSpan={6} className="text-center">No pending orders</TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order, index) => (
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
          <DialogContent 
            ref={addPositionDialogContentRef} 
            className="sm:max-w-[425px]" 
            onOpenAutoFocus={(e) => {
              // Only prevent default focus if needed for accessibility
              // Don't prevent focus completely as it might affect dropdown rendering
              e.preventDefault();
              // Focus the first interactive element manually after a short delay
              setTimeout(() => {
                const firstFocusable = addPositionDialogContentRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
                if (firstFocusable) {
                  firstFocusable.focus();
                }
              }, 50);
            }}
          >
            <DialogHeader>
              <DialogTitle>Add Position</DialogTitle>
              <DialogDescription>
                Enter the details for your new trading position.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency_pair">Currency Pair</Label>
                <SimpleSelect 
                  id="add_currency_pair"
                  value={formData.currency_pair}
                  onChange={(value) => {
                    setFormData({
                      ...formData,
                      currency_pair: value
                    });
                  }}
                  placeholder="Select currency pair"
                  options={getPairOptions()}
                />
              </div>
              
              <div>
                <Label htmlFor="trade_type">Trade Type</Label>
                <SimpleSelect 
                  id="add_trade_type"
                  value={formData.trade_type}
                  onChange={(value) => {
                    setFormData({
                      ...formData,
                      trade_type: value
                    });
                  }}
                  options={[
                    { value: 'BUY', label: 'Buy (Long)' },
                    { value: 'SELL', label: 'Sell (Short)' }
                  ]}
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleFormChange}
                />
              </div>
              
              <div>
                <Label htmlFor="stop_loss">Stop Loss (optional)</Label>
                <Input
                  id="stop_loss"
                  name="stop_loss"
                  type="number"
                  value={formData.stop_loss ?? ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div>
                <Label htmlFor="take_profit">Take Profit (optional)</Label>
                <Input
                  id="take_profit"
                  name="take_profit"
                  type="number"
                  value={formData.take_profit ?? ''}
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
          <DialogContent 
            ref={closePositionDialogContentRef} 
            className="sm:max-w-[425px]" 
            onOpenAutoFocus={(e) => {
              // Only prevent default focus if needed for accessibility
              // Don't prevent focus completely as it might affect dropdown rendering
              e.preventDefault();
              // Focus the first interactive element manually after a short delay
              setTimeout(() => {
                const firstFocusable = closePositionDialogContentRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
                if (firstFocusable) {
                  firstFocusable.focus();
                }
              }, 50);
            }}
          >
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
