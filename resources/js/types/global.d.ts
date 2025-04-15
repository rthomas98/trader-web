import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
    
    interface CandleData {
        x: number;
        y: [number, number, number, number]; // [open, high, low, close]
    }
    
    interface PredictionPoint {
        x: number;
        y: number;
    }
    
    interface Window {
        tradingChart: object;
        tradingChartFunctions: {
            updateChart: (currencyPair: string, timeframe: string, candleData?: CandleData[], predictiveData?: PredictionPoint[]) => void;
        };
    }
}
