import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { User } from '@/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, ArrowUp, ArrowDown, BarChart2, 
  Percent, DollarSign, Clock, ArrowLeft
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CopyTradingRelationship {
  id: number;
  trader_user_id: number;
  copier_user_id: number;
  status: 'active' | 'paused' | 'stopped';
  risk_allocation_percentage: number;
  max_drawdown_percentage: number | null;
  copy_fixed_size: boolean;
  fixed_lot_size: number | null;
  copy_stop_loss: boolean;
  copy_take_profit: boolean;
  started_at: string;
  stopped_at: string | null;
  created_at: string;
  updated_at: string;
  trader?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Trade {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number;
  lot_size: number;
  profit: number;
  opened_at: string;
  closed_at: string;
}

interface PerformanceSummary {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_profit: number;
  average_profit: number;
  profit_factor: number;
}

interface PerformanceData {
  summary: PerformanceSummary;
  trades: Trade[];
  equity_curve: {
    series: {
      name: string;
      data: [number, number][];
    }[];
  };
}

interface PerformancePageProps {
  breadcrumbs: {
    name: string;
    href: string;
  }[];
  relationship: CopyTradingRelationship;
  performanceData: PerformanceData;
  auth: {
    user: User;
  };
}

// Helper function to get chart options compatible with dark/light mode
const getChartOptions = (isDarkMode: boolean): ApexOptions => ({
  chart: {
    type: 'area',
    height: 350,
    zoom: {
      enabled: false
    },
    toolbar: {
      show: false
    },
    foreColor: isDarkMode ? '#f9f9f9' : '#1A161D', // Text color based on mode
    background: 'transparent' // Ensure transparent background
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  xaxis: {
    type: 'datetime',
    axisBorder: {
      color: isDarkMode ? '#444' : '#e0e0e0'
    },
    axisTicks: {
      color: isDarkMode ? '#444' : '#e0e0e0'
    }
  },
  yaxis: {
    labels: {
      formatter: function (val) {
        return "$" + val.toFixed(2);
      }
    },
    opposite: false
  },
  grid: {
    borderColor: isDarkMode ? '#444' : '#e0e0e0',
    strokeDashArray: 4,
    yaxis: {
      lines: {
        show: true
      }
    },
    xaxis: {
      lines: {
        show: true
      }
    } 
  },
  tooltip: {
    x: {
      format: 'dd MMM yyyy HH:mm'
    },
    y: {
      formatter: function (val) {
        return "$" + val.toFixed(2);
      }
    },
    theme: isDarkMode ? 'dark' : 'light'
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.9,
      stops: [0, 100]
    }
  },
  colors: ['#8D5EB7'] // Use brand color
});

export default function CopyTradingPerformance({ auth, breadcrumbs, relationship, performanceData }: PerformancePageProps) {
  // Assuming you have a way to detect dark mode, e.g., from a context or theme setting
  const isDarkMode = document.documentElement.classList.contains('dark'); 
  const chartOptions = getChartOptions(isDarkMode);
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Helper function to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'paused':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Paused</Badge>;
      case 'stopped':
        return <Badge variant="outline" className="text-red-500 border-red-500">Stopped</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <AppLayout
      user={auth.user}
      header={
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Copy Trading Performance</h1>
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={route('copy-trading.index')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Copy Trading
            </Link>
          </Button>
        </div>
      }
    >
      <Head title={`Copy Trading Performance - ${relationship.trader?.name}`} />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Trader Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${relationship.trader?.name}`} />
                  <AvatarFallback className="text-xl">{relationship.trader?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{relationship.trader?.name}</CardTitle>
                  <CardDescription>{relationship.trader?.email}</CardDescription>
                  <div className="flex mt-2 space-x-2">
                    {getStatusBadge(relationship.status)}
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      Since {new Date(relationship.started_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="text-sm text-muted-foreground">Copy Trading Settings</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center">
                    <TrendingUp className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    Risk: {relationship.risk_allocation_percentage}%
                  </div>
                  <div className="flex items-center">
                    {relationship.copy_fixed_size ? (
                      <>
                        <DollarSign className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                        Fixed: {relationship.fixed_lot_size} lots
                      </>
                    ) : (
                      <>
                        <Percent className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                        Proportional sizing
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className={relationship.copy_stop_loss ? "text-green-500 border-green-200" : "text-red-500 border-red-200"}>
                      SL: {relationship.copy_stop_loss ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className={relationship.copy_take_profit ? "text-green-500 border-green-200" : "text-red-500 border-red-200"}>
                      TP: {relationship.copy_take_profit ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Performance Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <DollarSign className={`h-4 w-4 ${performanceData.summary.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${performanceData.summary.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(performanceData.summary.total_profit)}
              </div>
              <p className="text-xs text-muted-foreground">
                {performanceData.summary.average_profit >= 0 ? 'Avg. profit' : 'Avg. loss'}: {formatCurrency(performanceData.summary.average_profit)} per trade
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.summary.win_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {performanceData.summary.winning_trades} wins / {performanceData.summary.losing_trades} losses
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.summary.profit_factor}</div>
              <p className="text-xs text-muted-foreground">
                Ratio of gross profit to gross loss
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.summary.total_trades}</div>
              <p className="text-xs text-muted-foreground">
                Copied trades executed
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="equity" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="equity">Equity Curve</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
          </TabsList>
          
          {/* Equity Curve Tab */}
          <TabsContent value="equity" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Equity Curve</CardTitle>
                <CardDescription>Performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceData.equity_curve.series[0]?.data.length > 0 ? (
                  <ReactApexChart 
                    options={chartOptions}
                    series={performanceData.equity_curve.series} 
                    type="area" 
                    height={350} 
                  />
                ) : (
                  <div className="h-80 w-full bg-muted flex items-center justify-center rounded-md">
                    <span className="text-muted-foreground">No performance data available yet.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Trade History Tab */}
          <TabsContent value="trades" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>
                  History of all copied trades from {relationship.trader?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {performanceData.trades.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Lot Size</TableHead>
                          <TableHead>Entry Price</TableHead>
                          <TableHead>Exit Price</TableHead>
                          <TableHead>Profit/Loss</TableHead>
                          <TableHead>Opened</TableHead>
                          <TableHead>Closed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceData.trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell className="font-medium">{trade.symbol}</TableCell>
                            <TableCell>
                              <Badge variant={trade.type === 'BUY' ? 'default' : 'destructive'} className={trade.type === 'BUY' ? 'bg-green-500' : ''}>
                                {trade.type === 'BUY' ? (
                                  <ArrowUp className="mr-1 h-3 w-3" />
                                ) : (
                                  <ArrowDown className="mr-1 h-3 w-3" />
                                )}
                                {trade.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{trade.lot_size}</TableCell>
                            <TableCell>{trade.entry_price.toFixed(5)}</TableCell>
                            <TableCell>{trade.exit_price.toFixed(5)}</TableCell>
                            <TableCell className={trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatCurrency(trade.profit)}
                            </TableCell>
                            <TableCell className="text-xs">{formatDate(trade.opened_at)}</TableCell>
                            <TableCell className="text-xs">{formatDate(trade.closed_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-60 w-full bg-muted flex items-center justify-center rounded-md">
                    <span className="text-muted-foreground">No trade history available yet.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
