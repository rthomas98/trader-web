import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TradingPosition } from '@/types/trading-position'; // Import TradingPosition type
import { WatchlistItem } from '@/types/watchlist-item'; // Import WatchlistItem type
import { AllocationItem } from '@/types/allocation-item'; // Import AllocationItem type
import { Overview } from '@/components/portfolio/overview';
import { RecentTrades, type Trade as RecentTradeType } from '@/components/portfolio/recent-trades'; // Import RecentTrades and its type
import OpenPositions from '@/components/portfolio/open-positions'; // Import OpenPositions component
import Watchlist from '@/components/portfolio/watchlist'; // Import the new Watchlist component
import Allocations from '@/components/portfolio/allocations'; // Import the Allocations component

interface PortfolioSummary {
    total_value: number;
    total_profit_loss: number;
    total_profit_loss_percentage: number;
    open_positions_count: number;
    positions_in_profit: number;
    positions_in_loss: number;
    available_margin?: number; // Ensure this is provided if needed
    // Add other fields as needed
}

interface PortfolioPerformanceData {
  month: string;
  total: number;
}

interface PortfolioPageProps {
    summary: PortfolioSummary;
    watchlist: WatchlistItem[]; // Add watchlist prop
    allocations: AllocationItem[]; // Add allocations prop
    performanceData?: PortfolioPerformanceData[]; // Add placeholder for performance data
    recentTrades?: RecentTradeType[]; // Use imported Trade type
    openPositions: TradingPosition[]; // Add openPositions prop (required by OpenPositions component)
    // Add other props if needed
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Portfolio',
        href: '/portfolio',
    },
];

// Format currency helper (Consider moving to a shared utils file)
const formatCurrency = (value: number | undefined, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(value ?? 0);
};

// Format percentage helper (Consider moving to a shared utils file)
const formatPercentage = (value: number | undefined) => {
    const val = value ?? 0;
    return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
};

export default function PortfolioPage({ summary, performanceData = [], recentTrades = [], openPositions = [], watchlist = [], allocations = [] }: PortfolioPageProps) {
    // Placeholder loading state - In reality, Inertia handles initial load.
    // We might need a state if fetching additional data client-side later.
    const loading = false;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portfolio" />
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
                </div>

                {/* Summary Cards - TODO: Populate with data from props */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                            {/* Icon? */}
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">{formatCurrency(summary?.total_value)}</div>
                             <p className="text-xs text-muted-foreground">
                                {formatPercentage(summary?.total_profit_loss_percentage)} overall
                             </p>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
                             {/* Icon? */}
                         </CardHeader>
                         <CardContent>
                              <div className={`text-2xl font-bold ${(summary?.total_profit_loss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {formatCurrency(summary?.total_profit_loss)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                 {formatPercentage(summary?.total_profit_loss_percentage)} from total
                              </p>
                         </CardContent>
                     </Card>
                     <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                             {/* Icon? */}
                         </CardHeader>
                         <CardContent>
                              <div className="text-2xl font-bold">{summary?.open_positions_count ?? 0}</div>
                              <p className="text-xs text-muted-foreground">
                                 {summary?.positions_in_profit ?? 0} in profit, {summary?.positions_in_loss ?? 0} in loss
                              </p>
                         </CardContent>
                     </Card>
                      <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Available Margin</CardTitle>
                             {/* Icon? */}
                         </CardHeader>
                         <CardContent>
                              {/* Assuming summary includes available_margin */}
                              <div className="text-2xl font-bold">{formatCurrency(summary?.available_margin)}</div> 
                              <p className="text-xs text-muted-foreground">
                                  {summary?.available_margin && summary?.total_value ? ((summary.available_margin / summary.total_value) * 100).toFixed(0) : 0}% of total value
                              </p>
                         </CardContent>
                     </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                    {/* Portfolio Overview Chart (Takes up more space) */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4">
                        <Overview data={performanceData} loading={loading} />
                    </div>

                    {/* Recent Trades / Activity Feed */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <RecentTrades trades={recentTrades} loading={loading} />
                    </div>
                </div>

                {/* Positions Table / Watchlist / Allocations (Placeholders) */}
                <div className="grid grid-cols-1 gap-4 mt-4">
                    {/* Open Positions Table */}
                    <OpenPositions openPositions={openPositions} />

                    {/* Watchlist */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Watchlist</CardTitle>
                            <CardDescription>Symbols you are tracking.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0"> 
                            <Watchlist watchlist={watchlist} />
                        </CardContent>
                    </Card>

                    {/* Asset Allocation */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Allocations</CardTitle>
                            <CardDescription>Distribution by open position count.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0"> 
                            <Allocations allocations={allocations} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
