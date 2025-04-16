// resources/js/types/trading-position.ts
export interface TradingPosition {
    id: number;
    user_id: number;
    currency_pair: string;
    trade_type: 'BUY' | 'SELL';
    entry_price: number;
    quantity: number;
    status: 'OPEN' | 'CLOSED';
    entry_time: string; // ISO 8601 date string
    exit_time: string | null; // ISO 8601 date string or null
    exit_price: number | null;
    profit_loss: number | null;
    stop_loss: number | null;
    take_profit: number | null;
    closed_at?: string | null; // Optional: ISO 8601 date string or null
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
}
