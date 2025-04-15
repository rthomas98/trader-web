/**
 * Represents a currency pair in the trading system
 */
export interface CurrencyPair {
  id: number;
  symbol: string;
  type?: string;
  price?: number;
  change_24h?: number;
  volume_24h?: number;
}

/**
 * Represents available pairs grouped by type
 */
export interface AvailablePairs {
  forex: CurrencyPair[];
  crypto: CurrencyPair[];
  commodities: CurrencyPair[];
  indices: CurrencyPair[];
}
