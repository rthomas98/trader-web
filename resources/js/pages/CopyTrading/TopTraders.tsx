import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, TrendingUp, Users, ArrowUpRight, ArrowDownRight, 
  Search, Filter, ChartBar, Calendar, Wallet, Shield 
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { route } from '@/ziggy';
import { toast } from 'sonner';
import axios from 'axios';

interface Trader {
  id: number;
  name: string;
  email: string;
  avatar: string;
  win_rate: number;
  followers: number;
  monthly_return: string;
  trades: number;
  strategy: string;
  risk: string;
}

interface Trade {
  trader: string;
  trader_id: number;
  pair: string;
  type: string;
  amount: string;
  profit: string;
  timestamp: string;
  take_profit: string;
  stop_loss: string;
}

interface TopTradersPageProps extends PageProps {
  topTraders: Trader[];
  recentTrades: Trade[];
}

export default function TopTraders({ auth, topTraders, recentTrades }: TopTradersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});

  // Filter traders based on search query and risk level
  const filteredTraders = topTraders.filter(trader => 
    trader.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedRisk === 'all' || trader.risk.toLowerCase() === selectedRisk.toLowerCase())
  );

  // Handle starting to copy a trader
  const handleCopyTrader = async (trader: Trader) => {
    setIsLoading(prev => ({ ...prev, [trader.id]: true }));
    
    try {
      await axios.post(route('copy-trading.store'), {
        trader_user_id: trader.id,
        risk_allocation_percentage: 10, // Default value
        max_drawdown_percentage: 20, // Default value
        copy_fixed_size: false,
        fixed_lot_size: null,
      }, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      toast.success(`You are now copying ${trader.name}`);
      window.location.href = route('copy-trading.index');
    } catch (error: any) {
      console.error('Error copying trader:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to start copying trader. Please try again.');
      }
    } finally {
      setIsLoading(prev => ({ ...prev, [trader.id]: false }));
    }
  };

  return (
    <AppLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Top Traders</h2>}
    >
      <Head title="Top Traders" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Social Trading</h1>
              <p className="text-muted-foreground">
                Follow and copy successful traders
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href={route('copy-trading.settings')}>
                  <Shield className="h-4 w-4" />
                </Link>
              </Button>
              <Badge variant="secondary" className="text-primary bg-primary/10">Discover</Badge>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search traders..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedRisk === "all" ? "default" : "outline"}
                onClick={() => setSelectedRisk("all")}
                className={selectedRisk === "all" ? "bg-primary hover:bg-primary/90" : ""}
              >
                All
              </Button>
              <Button
                variant={selectedRisk === "low" ? "default" : "outline"}
                onClick={() => setSelectedRisk("low")}
                className={selectedRisk === "low" ? "bg-primary hover:bg-primary/90" : ""}
              >
                Low Risk
              </Button>
              <Button
                variant={selectedRisk === "medium" ? "default" : "outline"}
                onClick={() => setSelectedRisk("medium")}
                className={selectedRisk === "medium" ? "bg-primary hover:bg-primary/90" : ""}
              >
                Medium Risk
              </Button>
              <Button
                variant={selectedRisk === "high" ? "default" : "outline"}
                onClick={() => setSelectedRisk("high")}
                className={selectedRisk === "high" ? "bg-primary hover:bg-primary/90" : ""}
              >
                High Risk
              </Button>
            </div>
          </div>

          <Tabs defaultValue="top-traders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="top-traders">Top Traders</TabsTrigger>
              <TabsTrigger value="recent-trades">Recent Trades</TabsTrigger>
              <TabsTrigger value="my-copies">My Copies</TabsTrigger>
            </TabsList>

            <TabsContent value="top-traders" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                {filteredTraders.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No traders found</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md">
                        Try adjusting your search or filters to find traders.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTraders.map((trader, index) => (
                    <Card key={index} className="mb-4 hover:bg-accent/50 transition-colors">
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={trader.avatar} />
                            <AvatarFallback>{trader.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{trader.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {trader.strategy}
                              </Badge>
                              <Badge variant={
                                trader.risk.toLowerCase() === "low" ? "secondary" :
                                trader.risk.toLowerCase() === "medium" ? "warning" :
                                "destructive"
                              } className="text-xs">
                                {trader.risk} Risk
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {trader.followers} followers • {trader.trades} trades
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">Win Rate</p>
                            <p className="text-green-500">{trader.win_rate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Monthly Return</p>
                            <p className={trader.monthly_return.startsWith('+') ? "text-green-500" : "text-red-500"}>
                              {trader.monthly_return}
                            </p>
                          </div>
                          <Button 
                            className="ml-4 bg-primary hover:bg-primary/90"
                            onClick={() => handleCopyTrader(trader)}
                            disabled={isLoading[trader.id]}
                          >
                            {isLoading[trader.id] ? 'Processing...' : 'Copy Trader'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recent-trades" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                {recentTrades.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No recent trades</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md">
                        Check back later for recent trading activity.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  recentTrades.map((trade, index) => (
                    <Card key={index} className="mb-4 hover:bg-accent/50 transition-colors">
                      <CardContent className="flex items-center justify-between p-6">
                        <div>
                          <p className="font-medium">{trade.trader}</p>
                          <p className="text-sm text-muted-foreground">{trade.timestamp}</p>
                        </div>
                        <div className="flex items-center gap-8">
                          <div>
                            <p className="text-sm font-medium">{trade.pair}</p>
                            <Badge variant={trade.type === "BUY" ? "success" : "destructive"}>
                              {trade.type} {trade.amount}
                            </Badge>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                              <p className="text-sm text-muted-foreground">TP: {trade.take_profit}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                              <p className="text-sm text-muted-foreground">SL: {trade.stop_loss}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Profit</p>
                            <p className={trade.profit.startsWith('+') ? "text-green-500" : "text-red-500"}>
                              {trade.profit}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCopyTrader({ id: trade.trader_id } as Trader)}
                            disabled={isLoading[trade.trader_id]}
                          >
                            Copy Trader
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="my-copies">
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Manage Your Copy Trading</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage your copy trading relationships
                  </p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href={route('copy-trading.index')}>
                      Go to Copy Trading Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
