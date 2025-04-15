// Mock data for forex trading application

export const mockTradingPairs = [
  { id: 'EUR/USD', name: 'EUR/USD', price: 1.0876, change: 0.0012, volume: 125000000, high24h: 1.0892, low24h: 1.0845 },
  { id: 'GBP/USD', name: 'GBP/USD', price: 1.2654, change: -0.0023, volume: 78000000, high24h: 1.2698, low24h: 1.2631 },
  { id: 'USD/JPY', name: 'USD/JPY', price: 149.85, change: 0.65, volume: 95000000, high24h: 150.20, low24h: 149.10 },
  { id: 'USD/CHF', name: 'USD/CHF', price: 0.9045, change: -0.0018, volume: 42000000, high24h: 0.9078, low24h: 0.9027 },
  { id: 'AUD/USD', name: 'AUD/USD', price: 0.6578, change: 0.0009, volume: 56000000, high24h: 0.6590, low24h: 0.6560 },
  { id: 'USD/CAD', name: 'USD/CAD', price: 1.3645, change: 0.0025, volume: 48000000, high24h: 1.3670, low24h: 1.3620 },
  { id: 'NZD/USD', name: 'NZD/USD', price: 0.6124, change: -0.0015, volume: 32000000, high24h: 0.6145, low24h: 0.6110 },
  { id: 'EUR/GBP', name: 'EUR/GBP', price: 0.8594, change: 0.0008, volume: 38000000, high24h: 0.8610, low24h: 0.8580 },
  { id: 'EUR/JPY', name: 'EUR/JPY', price: 162.98, change: 0.85, volume: 45000000, high24h: 163.50, low24h: 162.10 },
  { id: 'GBP/JPY', name: 'GBP/JPY', price: 189.62, change: 0.45, volume: 36000000, high24h: 190.10, low24h: 189.00 }
];

export const mockWallets = [
  { id: 'USD', name: 'US Dollar', balance: 50000.00, available: 35000.00, reserved: 15000.00 },
  { id: 'EUR', name: 'Euro', balance: 25000.00, available: 25000.00, reserved: 0.00 },
  { id: 'GBP', name: 'British Pound', balance: 20000.00, available: 15000.00, reserved: 5000.00 },
  { id: 'JPY', name: 'Japanese Yen', balance: 3000000.00, available: 2500000.00, reserved: 500000.00 },
  { id: 'CHF', name: 'Swiss Franc', balance: 15000.00, available: 15000.00, reserved: 0.00 },
  { id: 'AUD', name: 'Australian Dollar', balance: 30000.00, available: 30000.00, reserved: 0.00 },
  { id: 'CAD', name: 'Canadian Dollar', balance: 40000.00, available: 40000.00, reserved: 0.00 },
  { id: 'NZD', name: 'New Zealand Dollar', balance: 25000.00, available: 25000.00, reserved: 0.00 }
];

export const mockPositions = [
  {
    id: '1',
    pair: 'EUR/USD',
    type: 'forex',
    side: 'long',
    openPrice: 1.0845,
    currentPrice: 1.0876,
    amount: 100000,
    leverage: 10,
    margin: 10000,
    pnl: 310.00,
    pnlPercentage: 3.10,
    liquidationPrice: 1.0745,
    openTime: new Date('2023-05-15T10:30:00Z'),
    status: 'open'
  },
  {
    id: '2',
    pair: 'GBP/USD',
    type: 'forex',
    side: 'short',
    openPrice: 1.2625,
    currentPrice: 1.2654,
    amount: 50000,
    leverage: 5,
    margin: 10000,
    pnl: -145.00,
    pnlPercentage: -1.45,
    liquidationPrice: 1.2825,
    openTime: new Date('2023-05-16T14:45:00Z'),
    status: 'open'
  },
  {
    id: '3',
    pair: 'USD/JPY',
    type: 'forex',
    side: 'long',
    openPrice: 149.20,
    currentPrice: 149.85,
    amount: 200000,
    leverage: 20,
    margin: 10000,
    pnl: 433.33,
    pnlPercentage: 4.33,
    liquidationPrice: 148.20,
    openTime: new Date('2023-05-17T09:15:00Z'),
    status: 'open'
  },
  {
    id: '4',
    pair: 'AUD/USD',
    type: 'forex',
    side: 'long',
    openPrice: 0.6550,
    currentPrice: 0.6578,
    amount: 75000,
    leverage: 15,
    margin: 5000,
    pnl: 210.00,
    pnlPercentage: 4.20,
    liquidationPrice: 0.6450,
    openTime: new Date('2023-05-18T11:20:00Z'),
    status: 'open'
  }
];

export const mockOrders = [
  {
    id: '1',
    pair: 'EUR/USD',
    type: 'limit',
    side: 'buy',
    price: 1.0820,
    amount: 50000,
    filled: 0,
    status: 'open',
    createdAt: new Date('2023-05-15T16:30:00Z'),
    expiresAt: new Date('2023-05-22T16:30:00Z')
  },
  {
    id: '2',
    pair: 'GBP/USD',
    type: 'stop',
    side: 'sell',
    price: 1.2700,
    amount: 25000,
    filled: 0,
    status: 'open',
    createdAt: new Date('2023-05-16T13:15:00Z'),
    expiresAt: new Date('2023-05-23T13:15:00Z')
  },
  {
    id: '3',
    pair: 'USD/JPY',
    type: 'limit',
    side: 'sell',
    price: 150.50,
    amount: 100000,
    filled: 0,
    status: 'open',
    createdAt: new Date('2023-05-17T10:45:00Z'),
    expiresAt: new Date('2023-05-24T10:45:00Z')
  },
  {
    id: '4',
    pair: 'USD/CHF',
    type: 'stop',
    side: 'buy',
    price: 0.9000,
    amount: 30000,
    filled: 0,
    status: 'open',
    createdAt: new Date('2023-05-18T09:30:00Z'),
    expiresAt: new Date('2023-05-25T09:30:00Z')
  },
  {
    id: '5',
    pair: 'EUR/GBP',
    type: 'limit',
    side: 'buy',
    price: 0.8550,
    amount: 40000,
    filled: 0,
    status: 'open',
    createdAt: new Date('2023-05-19T15:00:00Z'),
    expiresAt: new Date('2023-05-26T15:00:00Z')
  }
];

// Generate historical candle data for a specific timeframe
export const generateHistoricalData = (pairId: string, timeframe: string, count: number = 100) => {
  const now = new Date();
  const data = [];
  let basePrice = getBasePriceForPair(pairId);
  let trend = Math.random() > 0.5 ? 1 : -1;
  let volatility = getPairVolatility(pairId);

  for (let i = count; i >= 0; i--) {
    // Calculate time based on timeframe
    const date = new Date(now.getTime() - i * getTimeframeInMs(timeframe));
    
    // Randomly change trend and volatility
    if (Math.random() < 0.05) trend = -trend;
    if (Math.random() < 0.1) volatility = Math.max(getMinVolatility(pairId), volatility + (Math.random() * getVolatilityChange(pairId) - getVolatilityChange(pairId)/2));
    
    // Calculate price movement
    const change = trend * (Math.random() * volatility);
    basePrice += change;
    
    // Generate candle
    const open = basePrice;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      x: date,
      y: [open, high, low, close],
      pair: pairId
    });
    
    // Set up for next candle
    basePrice = close;
  }
  
  return data;
};

// Helper function to get base price for a pair
const getBasePriceForPair = (pairId: string): number => {
  const pair = mockTradingPairs.find(p => p.id === pairId);
  return pair ? pair.price : 1.0;
};

// Helper function to get volatility for a pair
const getPairVolatility = (pairId: string): number => {
  // JPY pairs have higher nominal volatility
  if (pairId.includes('JPY')) {
    return 0.5;
  }
  
  // Major pairs have lower volatility
  if (pairId === 'EUR/USD' || pairId === 'GBP/USD' || pairId === 'USD/CHF' || pairId === 'AUD/USD') {
    return 0.0008;
  }
  
  // Cross pairs have medium volatility
  if (pairId === 'EUR/GBP' || pairId === 'EUR/JPY' || pairId === 'GBP/JPY') {
    return 0.0012;
  }
  
  return 0.001; // Default volatility
};

// Helper function to get minimum volatility for a pair
const getMinVolatility = (pairId: string): number => {
  if (pairId.includes('JPY')) {
    return 0.2;
  }
  return 0.0004;
};

// Helper function to get volatility change for a pair
const getVolatilityChange = (pairId: string): number => {
  if (pairId.includes('JPY')) {
    return 0.3;
  }
  return 0.0005;
};

// Helper function to convert timeframe to milliseconds
const getTimeframeInMs = (timeframe: string): number => {
  switch (timeframe) {
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '30m': return 30 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '4h': return 4 * 60 * 60 * 1000;
    case '1d': return 24 * 60 * 60 * 1000;
    case '1w': return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 1000;
  }
};
