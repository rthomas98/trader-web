import { LucideIcon } from 'lucide-react';
import { PageProps } from '@inertiajs/core';

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  avatar?: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  children?: NavItem[] | null;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
  icon?: LucideIcon;
}

export interface SharedData extends PageProps {
  user: User;
  flash?: {
    message?: string;
    success?: string;
    error?: string;
  };
  auth: {
    user: User;
  };
  ziggy: {
    url: string;
    port: number | null;
    defaults: Record<string, unknown>;
    routes: Record<string, unknown>;
  };
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  currency_type: 'FIAT' | 'CRYPTO';
  balance: number;
  available_balance: number;
  locked_balance: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  transactions?: WalletTransaction[];
  connected_accounts?: ConnectedAccount[];
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id?: string;
  transaction_type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'LOCK' | 'UNLOCK';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  fee: number;
  description: string;
  reference_id: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WalletSummary {
  total_balance: number;
  total_available_balance: number;
  total_locked_balance: number;
  wallets: {
    id: string;
    currency: string;
    currency_type: string;
    balance: number;
    available_balance: number;
    locked_balance: number;
    is_default: boolean;
  }[];
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  institution_id: string;
  institution_name: string;
  account_id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  mask: string;
  account_number_last4?: string;
  available_balance: number;
  current_balance: number;
  balance?: number;
  iso_currency_code: string;
  currency?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  is_verified: boolean;
  is_default: boolean;
  plaid_access_token: string;
  plaid_item_id: string;
  metadata?: Record<string, unknown>;
  daily_deposit_limit?: number;
  daily_withdrawal_limit?: number;
  monthly_deposit_limit?: number;
  monthly_withdrawal_limit?: number;
  min_transaction_amount?: number;
  max_transaction_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface FundingTransaction {
  id: string;
  user_id: string;
  connected_account_id: string;
  wallet_id: string;
  transaction_type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reference_id: string;
  description: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  connected_account?: ConnectedAccount;
  wallet?: Wallet;
}

export interface TradingPosition {
  id: string;
  user_id: string;
  symbol: string;
  position_type: 'LONG' | 'SHORT';
  status: 'OPEN' | 'CLOSED';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  leverage: number;
  margin: number;
  take_profit: number | null;
  stop_loss: number | null;
  profit_loss: number | null;
  profit_loss_percentage: number | null;
  open_date: string;
  close_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioPosition {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  market_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface MarketNews {
  id: string;
  headline: string;
  source: string;
  url: string;
  summary: string;
  image_url: string | null;
  published_at: string;
  symbols: string[];
  created_at: string;
  updated_at: string;
}

export interface EconomicCalendarEvent {
  id: string;
  event_id: string;
  title: string;
  country: string;
  date: string;
  time: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  created_at: string;
  updated_at: string;
}
