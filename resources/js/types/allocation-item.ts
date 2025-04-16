export interface AllocationItem {
    symbol: string;       // e.g., 'EUR/USD'
    count: number;        // Count of positions for this symbol
    percentage: number;   // Percentage of total open positions
    value: number;        // Placeholder for actual monetary value
}
