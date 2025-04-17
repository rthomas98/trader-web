import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingUp, TrendingDown, X, Plus, Bell, Percent } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { route } from 'ziggy-js';

interface PriceAlert {
  id: number;
  user_id: number;
  symbol: string;
  condition: 'above' | 'below' | 'percent_change';
  price: number;
  percent_change?: number;
  is_recurring: boolean;
  is_triggered: boolean;
  triggered_at?: string;
  created_at: string;
}

interface Props {
  priceAlerts: PriceAlert[];
  triggeredAlerts: PriceAlert[];
}

export default function PriceAlerts({ priceAlerts, triggeredAlerts }: Props) {
  const [activeTab, setActiveTab] = useState('active');
  
  const { data, setData, post, processing, errors, reset } = useForm({
    symbol: '',
    condition: 'above' as 'above' | 'below' | 'percent_change',
    price: 0,
    percent_change: 1,
    is_recurring: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('notifications.createPriceAlert'), {
      onSuccess: () => {
        toast.success('Price alert created successfully');
        reset();
      },
      onError: () => {
        toast.error('Failed to create price alert');
      }
    });
  };

  const handleDeleteAlert = async (alertId: number) => {
    try {
      await axios.delete(route('notifications.deletePriceAlert', { priceAlert: alertId }), {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      
      toast.success('Price alert deleted successfully');
    } catch (error) {
      console.error('Error deleting price alert:', error);
      toast.error('Failed to delete price alert');
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Create Price Alert</CardTitle>
            <CardDescription>
              Get notified when a price reaches your target
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g. EURUSD"
                  value={data.symbol}
                  onChange={(e) => setData('symbol', e.target.value)}
                  className="uppercase"
                />
                {errors.symbol && (
                  <p className="text-sm text-red-500">{errors.symbol}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={data.condition}
                  onValueChange={(value: 'above' | 'below' | 'percent_change') => setData('condition', value)}
                >
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Price Above</SelectItem>
                    <SelectItem value="below">Price Below</SelectItem>
                    <SelectItem value="percent_change">Percent Change</SelectItem>
                  </SelectContent>
                </Select>
                {errors.condition && (
                  <p className="text-sm text-red-500">{errors.condition}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">
                  {data.condition === 'percent_change' ? 'Reference Price' : 'Target Price'}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.00001"
                  value={data.price}
                  onChange={(e) => setData('price', parseFloat(e.target.value))}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
                )}
              </div>
              
              {data.condition === 'percent_change' && (
                <div className="space-y-2">
                  <Label htmlFor="percent_change">Percent Change (%)</Label>
                  <Input
                    id="percent_change"
                    type="number"
                    step="0.1"
                    value={data.percent_change}
                    onChange={(e) => setData('percent_change', parseFloat(e.target.value))}
                  />
                  {errors.percent_change && (
                    <p className="text-sm text-red-500">{errors.percent_change}</p>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={data.is_recurring}
                  onCheckedChange={(checked: boolean) => setData('is_recurring', checked)}
                />
                <Label htmlFor="is_recurring">Recurring Alert</Label>
              </div>
              
              <Button 
                type="submit" 
                disabled={processing} 
                className="w-full bg-[#8D5EB7] hover:bg-[#8D5EB7]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Price Alerts</CardTitle>
            <CardDescription>
              Manage your active and triggered price alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active Alerts</TabsTrigger>
                <TabsTrigger value="triggered">Triggered Alerts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4">
                {priceAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="font-medium">No active price alerts</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a price alert to get notified when a price reaches your target
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {priceAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          {alert.condition === 'above' ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : alert.condition === 'below' ? (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          ) : (
                            <Percent className="h-5 w-5 text-blue-500" />
                          )}
                          
                          <div>
                            <p className="font-medium">{alert.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.condition === 'above' && 'Price Above '}
                              {alert.condition === 'below' && 'Price Below '}
                              {alert.condition === 'percent_change' && 'Change from '}
                              {alert.price.toFixed(5)}
                              {alert.condition === 'percent_change' && 
                                ` (${alert.percent_change}%)`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {alert.is_recurring ? 'Recurring' : 'One-time'} • 
                              Created {formatDate(alert.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="triggered" className="mt-4">
                {triggeredAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="font-medium">No triggered alerts</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your triggered alerts will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {triggeredAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {alert.condition === 'above' ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : alert.condition === 'below' ? (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          ) : (
                            <Percent className="h-5 w-5 text-blue-500" />
                          )}
                          
                          <div>
                            <p className="font-medium">{alert.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.condition === 'above' && 'Price Above '}
                              {alert.condition === 'below' && 'Price Below '}
                              {alert.condition === 'percent_change' && 'Change from '}
                              {alert.price.toFixed(5)}
                              {alert.condition === 'percent_change' && 
                                ` (${alert.percent_change}%)`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Triggered {alert.triggered_at ? formatDate(alert.triggered_at) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
