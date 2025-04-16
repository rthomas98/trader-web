export interface WatchlistItem {
    id: string; // Assuming UUID
    user_id: number; // Assuming bigint from users table
    symbol: string; // e.g., 'EUR/USD'
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
    // We might add price data later if needed
    current_price?: number;
    price_change?: number;
    price_change_percentage?: number;
}
