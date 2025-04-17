import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Bell, AlertTriangle, TrendingUp, TrendingDown, Award, BarChart, Users, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import NotificationPreferences from './components/NotificationPreferences';
import PriceAlerts from './components/PriceAlerts';
import NotificationsList from './components/NotificationsList';

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

interface Notification {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    icon?: string;
    color?: string;
    action_url?: string;
  };
  read_at: string | null;
  created_at: string;
}

interface Props {
  preferences: NotificationPreference;
  priceAlerts: PriceAlert[];
  triggeredAlerts: PriceAlert[];
  unreadNotifications: Notification[];
  readNotifications: Notification[];
  stats: {
    unreadCount: number;
    alertsCount: number;
  };
}

export default function NotificationsSettings({
  preferences,
  priceAlerts,
  triggeredAlerts,
  unreadNotifications,
  readNotifications,
  stats
}: Props) {
  const { url } = usePage();
  const searchParams = new URLSearchParams(url.split('?')[1]);
  const tabParam = searchParams.get('tab');
  
  // Set initial active tab based on URL parameter or default to 'preferences'
  const [activeTab, setActiveTab] = useState(
    tabParam === 'price-alerts' || tabParam === 'notifications' 
      ? tabParam 
      : 'preferences'
  );

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url);
  };

  return (
    <AppLayout>
      <Head title="Notification Settings" />
      
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
            <p className="text-muted-foreground">
              Manage your notification preferences and alerts
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              <span>{stats.unreadCount} unread</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>{stats.alertsCount} active alerts</span>
            </Badge>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="price-alerts">Price Alerts</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences">
            <NotificationPreferences preferences={preferences} />
          </TabsContent>
          
          <TabsContent value="price-alerts">
            <PriceAlerts 
              priceAlerts={priceAlerts} 
              triggeredAlerts={triggeredAlerts} 
            />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationsList 
              unreadNotifications={unreadNotifications} 
              readNotifications={readNotifications} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
