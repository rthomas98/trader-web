import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { User } from '@/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserCheck, LineChart, BarChart2, TrendingUp, Percent, Copy, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { StrategyCard } from '@/components/SocialTrading/StrategyCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

interface TraderStats {
  followers_count: number;
  following_count: number;
  // These would come from the trader's performance data
  win_rate?: number;
  profit_factor?: number;
  total_trades?: number;
  avg_profit_per_trade?: number;
}

interface TraderProfileData {
  id: number;
  name: string;
  email: string;
  stats: TraderStats;
  performanceChartData: {
    series: { name: string; data: Array<[number, number]> }[];
    // categories are handled by datetime axis type
  };
  strategies: {
    id: number;
    name: string;
    description: string | null;
  }[];
}

interface TraderProfileProps {
  breadcrumbs: {
    name: string;
    href: string;
  }[];
  trader: TraderProfileData;
  isFollowing: boolean;
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

export default function TraderProfile({ auth, breadcrumbs, trader, isFollowing }: TraderProfileProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isCopyingLoading, setIsCopyingLoading] = useState(false);

  // Assuming you have a way to detect dark mode, e.g., from a context or theme setting
  // Replace this with your actual dark mode detection logic
  const isDarkMode = document.documentElement.classList.contains('dark'); 
  const chartOptions = getChartOptions(isDarkMode);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      if (following) {
        await axios.delete(route('social.unfollow', trader.id));
        setFollowing(false);
      } else {
        await axios.post(route('social.follow', trader.id));
        setFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Define the form schema for copy trading settings
  const copyTradingFormSchema = z.object({
    trader_user_id: z.number(),
    risk_allocation_percentage: z.number().min(0.01).max(100),
    max_drawdown_percentage: z.number().min(0.01).max(100).optional(),
    copy_fixed_size: z.boolean(),
    fixed_lot_size: z.number().min(0.01).optional(),
    copy_stop_loss: z.boolean(),
    copy_take_profit: z.boolean(),
  });

  // Create the form
  const copyTradingForm = useForm<z.infer<typeof copyTradingFormSchema>>({
    resolver: zodResolver(copyTradingFormSchema),
    defaultValues: {
      trader_user_id: trader.id,
      risk_allocation_percentage: 50, // Default to 50% risk allocation
      max_drawdown_percentage: 20, // Default to 20% max drawdown
      copy_fixed_size: false, // Default to proportional sizing
      fixed_lot_size: 0.1, // Default lot size if fixed sizing is enabled
      copy_stop_loss: true, // Default to copying stop loss
      copy_take_profit: true, // Default to copying take profit
    },
  });

  // Handle form submission
  const onSubmitCopyTradingForm = async (values: z.infer<typeof copyTradingFormSchema>) => {
    setIsCopyingLoading(true);
    try {
      await axios.post(route('copy-trading.store'), values);
      
      toast.success("You are now copying this trader's trades.");
      
      setIsCopyDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error starting copy trading:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to start copy trading. Please try again.";
      
      toast.error(errorMessage);
    } finally {
      setIsCopyingLoading(false);
    }
  };

  return (
    <AppLayout
      user={auth.user}
      header={
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trader Profile</h1>
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      }
    >
      <Head title={`${trader.name}'s Profile`} />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Trader Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${trader.name}`} />
                  <AvatarFallback className="text-2xl">{trader.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{trader.name}</CardTitle>
                  <CardDescription className="text-sm">{trader.email}</CardDescription>
                  <div className="flex mt-2 space-x-2">
                    <Badge variant="outline" className="flex items-center">
                      <UserCheck className="mr-1 h-3.5 w-3.5" />
                      {trader.stats.followers_count} Followers
                    </Badge>
                    <Badge variant="outline" className="flex items-center">
                      <UserPlus className="mr-1 h-3.5 w-3.5" />
                      Following {trader.stats.following_count}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleFollow}
                  disabled={isLoading}
                  variant={following ? "outline" : "default"}
                  className="md:self-start"
                >
                  {isLoading ? (
                    "Loading..."
                  ) : following ? (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                
                {/* Copy Trades Button and Dialog */}
                <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="md:self-start bg-[#8D5EB7] hover:bg-[#8D5EB7]/90">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Trades
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Copy {trader.name}'s Trades</DialogTitle>
                      <DialogDescription>
                        Configure how you want to copy this trader's trades. You can adjust risk settings and preferences.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...copyTradingForm}>
                      <form onSubmit={copyTradingForm.handleSubmit(onSubmitCopyTradingForm)} className="space-y-4">
                        <FormField
                          control={copyTradingForm.control}
                          name="risk_allocation_percentage"
                          render={({ field }: { field: { value: number; onChange: (value: number) => void } }) => (
                            <FormItem>
                              <FormLabel>Risk Allocation (%)</FormLabel>
                              <FormDescription>
                                Percentage of your capital to allocate relative to the trader's position sizes.
                              </FormDescription>
                              <div className="flex items-center gap-4">
                                <FormControl>
                                  <Slider
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="flex-1"
                                  />
                                </FormControl>
                                <span className="w-12 text-center">{field.value}%</span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={copyTradingForm.control}
                          name="max_drawdown_percentage"
                          render={({ field }: { field: { value: number | undefined; onChange: (value: number) => void } }) => (
                            <FormItem>
                              <FormLabel>Max Drawdown (%)</FormLabel>
                              <FormDescription>
                                Maximum loss percentage before copy trading is automatically stopped.
                              </FormDescription>
                              <div className="flex items-center gap-4">
                                <FormControl>
                                  <Slider
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={[field.value || 20]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="flex-1"
                                  />
                                </FormControl>
                                <span className="w-12 text-center">{field.value || 20}%</span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={copyTradingForm.control}
                            name="copy_fixed_size"
                            render={({ field }: { field: { value: boolean; onChange: (value: boolean) => void } }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Use Fixed Lot Size</FormLabel>
                                  <FormDescription>
                                    Use a fixed lot size for all trades instead of proportional sizing.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          {copyTradingForm.watch("copy_fixed_size") && (
                            <FormField
                              control={copyTradingForm.control}
                              name="fixed_lot_size"
                              render={({ field }: { field: { value: number | undefined; onChange: (value: number) => void } }) => (
                                <FormItem>
                                  <FormLabel>Fixed Lot Size</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    The fixed lot size to use for all copied trades.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={copyTradingForm.control}
                            name="copy_stop_loss"
                            render={({ field }: { field: { value: boolean; onChange: (value: boolean) => void } }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Copy Stop Loss</FormLabel>
                                  <FormDescription>
                                    Copy the trader's stop loss levels.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={copyTradingForm.control}
                            name="copy_take_profit"
                            render={({ field }: { field: { value: boolean; onChange: (value: boolean) => void } }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Copy Take Profit</FormLabel>
                                  <FormDescription>
                                    Copy the trader's take profit levels.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4 flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-800 dark:text-amber-300">
                            <p className="font-medium">Important Risk Notice</p>
                            <p className="mt-1">
                              Copy trading involves risk. Past performance is not indicative of future results.
                              Only allocate funds you can afford to lose.
                            </p>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCopyDialogOpen(false)}
                            disabled={isCopyingLoading}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isCopyingLoading}
                            className="bg-[#8D5EB7] hover:bg-[#8D5EB7]/90"
                          >
                            {isCopyingLoading ? "Processing..." : "Start Copy Trading"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Performance Metrics */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Performance Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trader.stats.win_rate || 65}%</div>
                  <p className="text-xs text-muted-foreground">
                    Percentage of profitable trades
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trader.stats.profit_factor || 2.3}</div>
                  <p className="text-xs text-muted-foreground">
                    Ratio of gross profit to gross loss
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trader.stats.total_trades || 124}</div>
                  <p className="text-xs text-muted-foreground">
                    Number of trades executed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Profit/Trade</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${trader.stats.avg_profit_per_trade || 42.50}</div>
                  <p className="text-xs text-muted-foreground">
                    Average profit per trade
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance History</CardTitle>
                <CardDescription>Account equity curve over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ReactApexChart 
                  options={chartOptions}
                  series={trader.performanceChartData.series} 
                  type="area" 
                  height={350} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Performance Metrics</CardTitle>
                <CardDescription>Equity curve showing profit/loss over time.</CardDescription>
              </CardHeader>
              <CardContent>
                {trader.performanceChartData && trader.performanceChartData.series[0]?.data.length > 0 ? (
                  <ReactApexChart 
                    options={chartOptions}
                    series={trader.performanceChartData.series} 
                    type="area" 
                    height={350} 
                  />
                ) : (
                  <div className="h-80 w-full bg-muted flex items-center justify-center rounded-md">
                    <span className="text-muted-foreground">No performance data available.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="strategies" className="space-y-4 mt-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Trading Strategies</CardTitle>
                <CardDescription>
                  Strategies employed by this trader.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {trader.strategies && trader.strategies.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {trader.strategies.map((strategy) => (
                      <StrategyCard key={strategy.id} strategy={strategy} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <LineChart className="h-10 w-10 mb-3" />
                    <p>This trader hasn't added any strategies yet.</p>
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
