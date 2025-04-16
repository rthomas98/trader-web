import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, DollarSign, LineChart, Newspaper, Calendar } from 'lucide-react';

// Define types for the props
interface Wallet {
  id: string;
  currency: string;
  balance: number;
  available_balance: number;
}

interface TradingPosition {
  id: string;
  currency_pair: string;
  trade_type: 'BUY' | 'SELL';
  entry_price: number;
  current_price: number;
  quantity: number;
  profit_loss: number;
  profit_loss_percentage: number;
  entry_time: string;
}

interface PortfolioPosition {
  id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
}

interface MarketNews {
  url: string;
  headline: string;
  source: string;
  time_published: string;
  summary: string;
}

interface EconomicEvent {
  event_id: string;
  title: string;
  country: string;
  event_date: string;
  event_time: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
}

interface MarketOverview {
  indices: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
  }>;
  forex: Array<{
    pair: string;
    price: number;
    change: number;
    change_percent: number;
  }>;
  crypto: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
  }>;
}

interface AccountSummary {
  total_balance: number;
  trading_pl: number;
  portfolio_value: number;
  available_margin: number;
}

interface PlaidAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface DashboardProps {
  wallets: Wallet[];
  totalBalance: number;
  tradingPositions: TradingPosition[];
  portfolioPositions: PortfolioPosition[];
  latestNews: MarketNews[];
  upcomingEvents: EconomicEvent[];
  marketOverview: MarketOverview;
  accountSummary: AccountSummary;
  plaidAccounts: PlaidAccount[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

// Format currency helper
const formatCurrency = (value: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

// Format percentage helper
const formatPercentage = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export default function Dashboard({
  wallets,
  totalBalance,
  tradingPositions,
  portfolioPositions,
  latestNews,
  upcomingEvents,
  marketOverview,
  accountSummary,
  plaidAccounts,
}: DashboardProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Account Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {wallets && wallets.length > 0 ? (
                <div className="text-2xl font-bold">{formatCurrency(accountSummary.total_balance)}</div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Create a wallet to view your balance.
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trading P&L</CardTitle>
              {accountSummary.trading_pl >= 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${accountSummary.trading_pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(accountSummary.trading_pl)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(accountSummary.portfolio_value)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Margin</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(accountSummary.available_margin)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Positions & Portfolio */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Trading Positions */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Trading Positions</CardTitle>
              <CardDescription>Your active trading positions</CardDescription>
            </CardHeader>
            <CardContent>
              {tradingPositions && tradingPositions.length > 0 ? (
                <div className="space-y-4">
                  {tradingPositions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <div className="font-medium">{position.currency_pair}</div>
                        <div className="text-sm text-muted-foreground">
                          {position.trade_type} • {position.quantity} units
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${position.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(position.profit_loss)}
                        </div>
                        <div className={`text-sm ${position.profit_loss_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercentage(position.profit_loss_percentage)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No active trading positions
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Positions */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>Your investment portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              {portfolioPositions && portfolioPositions.length > 0 ? (
                <div className="space-y-4">
                  {portfolioPositions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {position.quantity} shares • Avg {formatCurrency(position.average_price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(position.current_value)}</div>
                        <div className={`text-sm ${position.profit_loss_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercentage(position.profit_loss_percentage)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No portfolio positions
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Plaid Linked Accounts */}
        {plaidAccounts && plaidAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Linked Bank Accounts</CardTitle>
              <CardDescription>Balances from your connected accounts via Plaid</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plaidAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-muted-foreground">Account ID: ...{account.id.slice(-4)}</div>
                    </div>
                    <div className="font-semibold">{formatCurrency(account.balance, account.currency)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Market News & Economic Calendar */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Market News */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Market News</CardTitle>
                <CardDescription>Latest financial news</CardDescription>
              </div>
              <Newspaper className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {latestNews && latestNews.length > 0 ? (
                <div className="space-y-4">
                  {latestNews.map((news) => (
                    <div key={news.url} className="space-y-1 border-b pb-3">
                      <a href={news.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                        {news.headline}
                      </a>
                      <div className="text-sm text-muted-foreground">
                        {news.source} • {new Date(news.time_published).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No market news available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Economic Calendar */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Economic Calendar</CardTitle>
                <CardDescription>Upcoming economic events</CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.event_id} className="space-y-1 border-b pb-3">
                      <div className="font-medium">{event.title}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {event.country} • {new Date(event.event_date).toLocaleDateString()} {event.event_time}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          event.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          event.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {event.impact.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Forecast:</span> {event.forecast} • 
                        <span className="text-muted-foreground"> Previous:</span> {event.previous}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No upcoming economic events
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Market Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>Major indices, forex, and cryptocurrencies</CardDescription>
          </CardHeader>
          <CardContent>
            {marketOverview ? (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Indices */}
                <div>
                  <h3 className="mb-3 font-medium">Indices</h3>
                  <div className="space-y-2">
                    {marketOverview.indices && marketOverview.indices.map((index, i) => (
                      <div key={`index-${index.symbol}-${i}`} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{index.symbol}</div>
                          <div className="text-sm text-muted-foreground">{index.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{index.price.toLocaleString()}</div>
                          <div className={`text-sm ${index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {index.change > 0 ? '+' : ''}{index.change.toFixed(2)} ({index.change_percent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forex */}
                <div>
                  <h3 className="mb-3 font-medium">Forex</h3>
                  <div className="space-y-2">
                    {marketOverview.forex && marketOverview.forex.map((pair, index) => (
                      <div key={`forex-${pair.pair}-${index}`} className="flex items-center justify-between">
                        <div className="font-medium">{pair.pair}</div>
                        <div className="text-right">
                          <div className="font-medium">{pair.price.toFixed(4)}</div>
                          <div className={`text-sm ${pair.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {pair.change > 0 ? '+' : ''}{pair.change.toFixed(4)} ({pair.change_percent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crypto */}
                <div>
                  <h3 className="mb-3 font-medium">Cryptocurrencies</h3>
                  <div className="space-y-2">
                    {marketOverview.crypto && marketOverview.crypto.map((crypto, i) => (
                      <div key={`crypto-${crypto.symbol}-${i}`} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{crypto.symbol}</div>
                          <div className="text-sm text-muted-foreground">{crypto.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(crypto.price, 'USD')}</div>
                          <div className={`text-sm ${crypto.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {crypto.change > 0 ? '+' : ''}{crypto.change.toFixed(2)} ({crypto.change_percent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No market data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
