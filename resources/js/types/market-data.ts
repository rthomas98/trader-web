/**
 * Represents a single data point for historical or predictive market data
 */
export interface RawDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Represents the structure of historical market data
 */
export interface HistoricalData {
  historical: RawDataPoint[];
  predictive?: RawDataPoint[];
}

/**
 * Represents current price data for a currency pair
 */
export interface CurrentPrice {
  id: number;
  symbol: string;
  price: number;
  timestamp: number;
}

/**
 * Represents market overview data
 */
export interface MarketOverview {
  forex: {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
  }[];
  crypto: {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
  }[];
  indices: {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
  }[];
}
