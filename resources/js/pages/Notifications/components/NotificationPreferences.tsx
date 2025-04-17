import React from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreference {
  id?: number;
  user_id: number;
  price_alerts: boolean;
  market_news: boolean;
  trade_executed: boolean;
  trade_closed: boolean;
  stop_loss_hit: boolean;
  take_profit_hit: boolean;
  new_copier: boolean;
  copier_stopped: boolean;
  copy_request_received: boolean;
  copy_request_approved: boolean;
  copy_request_rejected: boolean;
  profit_milestone: boolean;
  loss_milestone: boolean;
  win_streak: boolean;
  drawdown_alert: boolean;
  new_follower: boolean;
  trader_new_trade: boolean;
  trader_performance_update: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
}

interface Props {
  preferences: NotificationPreference;
}

export default function NotificationPreferences({ preferences }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm<NotificationPreference>({
    ...preferences,
    // Set defaults for any missing values
    price_alerts: preferences.price_alerts ?? true,
    market_news: preferences.market_news ?? true,
    trade_executed: preferences.trade_executed ?? true,
    trade_closed: preferences.trade_closed ?? true,
    stop_loss_hit: preferences.stop_loss_hit ?? true,
    take_profit_hit: preferences.take_profit_hit ?? true,
    new_copier: preferences.new_copier ?? true,
    copier_stopped: preferences.copier_stopped ?? true,
    copy_request_received: preferences.copy_request_received ?? true,
    copy_request_approved: preferences.copy_request_approved ?? true,
    copy_request_rejected: preferences.copy_request_rejected ?? true,
    profit_milestone: preferences.profit_milestone ?? true,
    loss_milestone: preferences.loss_milestone ?? true,
    win_streak: preferences.win_streak ?? true,
    drawdown_alert: preferences.drawdown_alert ?? true,
    new_follower: preferences.new_follower ?? true,
    trader_new_trade: preferences.trader_new_trade ?? true,
    trader_performance_update: preferences.trader_performance_update ?? true,
    email_notifications: preferences.email_notifications ?? true,
    push_notifications: preferences.push_notifications ?? true,
    in_app_notifications: preferences.in_app_notifications ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('notifications.updatePreferences'), {
      onSuccess: () => {
        toast.success('Notification preferences updated successfully');
      },
      onError: () => {
        toast.error('Failed to update notification preferences');
      }
    });
  };

  const handleToggle = (field: keyof NotificationPreference) => {
    setData(field, !data[field]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Preferences</CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={data.email_notifications} 
                  onCheckedChange={() => handleToggle('email_notifications')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your device
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={data.push_notifications} 
                  onCheckedChange={() => handleToggle('push_notifications')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">In-App Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in the app
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={data.in_app_notifications} 
                  onCheckedChange={() => handleToggle('in_app_notifications')} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Price & Market Notifications</CardTitle>
            <CardDescription>
              Notifications related to price movements and market news
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Price Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications when price targets are hit
                  </p>
                </div>
                <Switch 
                  checked={data.price_alerts} 
                  onCheckedChange={() => handleToggle('price_alerts')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Market News</p>
                  <p className="text-sm text-muted-foreground">
                    Important market news and updates
                  </p>
                </div>
                <Switch 
                  checked={data.market_news} 
                  onCheckedChange={() => handleToggle('market_news')} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Trade Notifications</CardTitle>
            <CardDescription>
              Notifications related to your trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trade Executed</p>
                  <p className="text-sm text-muted-foreground">
                    When a new trade is opened
                  </p>
                </div>
                <Switch 
                  checked={data.trade_executed} 
                  onCheckedChange={() => handleToggle('trade_executed')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trade Closed</p>
                  <p className="text-sm text-muted-foreground">
                    When a trade is closed
                  </p>
                </div>
                <Switch 
                  checked={data.trade_closed} 
                  onCheckedChange={() => handleToggle('trade_closed')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stop Loss Hit</p>
                  <p className="text-sm text-muted-foreground">
                    When a stop loss is triggered
                  </p>
                </div>
                <Switch 
                  checked={data.stop_loss_hit} 
                  onCheckedChange={() => handleToggle('stop_loss_hit')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Take Profit Hit</p>
                  <p className="text-sm text-muted-foreground">
                    When a take profit is triggered
                  </p>
                </div>
                <Switch 
                  checked={data.take_profit_hit} 
                  onCheckedChange={() => handleToggle('take_profit_hit')} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Copy Trading Notifications</CardTitle>
            <CardDescription>
              Notifications related to copy trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Copier</p>
                  <p className="text-sm text-muted-foreground">
                    When someone starts copying your trades
                  </p>
                </div>
                <Switch 
                  checked={data.new_copier} 
                  onCheckedChange={() => handleToggle('new_copier')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Copier Stopped</p>
                  <p className="text-sm text-muted-foreground">
                    When someone stops copying your trades
                  </p>
                </div>
                <Switch 
                  checked={data.copier_stopped} 
                  onCheckedChange={() => handleToggle('copier_stopped')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Copy Request Received</p>
                  <p className="text-sm text-muted-foreground">
                    When you receive a copy request
                  </p>
                </div>
                <Switch 
                  checked={data.copy_request_received} 
                  onCheckedChange={() => handleToggle('copy_request_received')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Copy Request Approved</p>
                  <p className="text-sm text-muted-foreground">
                    When your copy request is approved
                  </p>
                </div>
                <Switch 
                  checked={data.copy_request_approved} 
                  onCheckedChange={() => handleToggle('copy_request_approved')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Copy Request Rejected</p>
                  <p className="text-sm text-muted-foreground">
                    When your copy request is rejected
                  </p>
                </div>
                <Switch 
                  checked={data.copy_request_rejected} 
                  onCheckedChange={() => handleToggle('copy_request_rejected')} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Notifications</CardTitle>
            <CardDescription>
              Notifications related to your trading performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Profit Milestone</p>
                  <p className="text-sm text-muted-foreground">
                    When you reach a profit milestone
                  </p>
                </div>
                <Switch 
                  checked={data.profit_milestone} 
                  onCheckedChange={() => handleToggle('profit_milestone')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Loss Milestone</p>
                  <p className="text-sm text-muted-foreground">
                    When you reach a loss threshold
                  </p>
                </div>
                <Switch 
                  checked={data.loss_milestone} 
                  onCheckedChange={() => handleToggle('loss_milestone')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Win Streak</p>
                  <p className="text-sm text-muted-foreground">
                    When you achieve a winning streak
                  </p>
                </div>
                <Switch 
                  checked={data.win_streak} 
                  onCheckedChange={() => handleToggle('win_streak')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Drawdown Alert</p>
                  <p className="text-sm text-muted-foreground">
                    When your account experiences significant drawdown
                  </p>
                </div>
                <Switch 
                  checked={data.drawdown_alert} 
                  onCheckedChange={() => handleToggle('drawdown_alert')} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Social Notifications</CardTitle>
            <CardDescription>
              Notifications related to social interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Follower</p>
                  <p className="text-sm text-muted-foreground">
                    When someone follows you
                  </p>
                </div>
                <Switch 
                  checked={data.new_follower} 
                  onCheckedChange={() => handleToggle('new_follower')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trader New Trade</p>
                  <p className="text-sm text-muted-foreground">
                    When a trader you follow makes a new trade
                  </p>
                </div>
                <Switch 
                  checked={data.trader_new_trade} 
                  onCheckedChange={() => handleToggle('trader_new_trade')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trader Performance Update</p>
                  <p className="text-sm text-muted-foreground">
                    When a trader you follow has a performance update
                  </p>
                </div>
                <Switch 
                  checked={data.trader_performance_update} 
                  onCheckedChange={() => handleToggle('trader_performance_update')} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={processing} className="bg-[#8D5EB7] hover:bg-[#8D5EB7]/90">
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
