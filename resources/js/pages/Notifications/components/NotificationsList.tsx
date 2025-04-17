import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, X, TrendingUp, TrendingDown, Award, AlertTriangle, BarChart, Users, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { route } from 'ziggy-js'; // Fix the route import error
import { toast } from 'sonner';

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
  unreadNotifications: Notification[];
  readNotifications: Notification[];
}

export default function NotificationsList({ unreadNotifications, readNotifications }: Props) {
  const [activeTab, setActiveTab] = useState('unread');
  const [localUnread, setLocalUnread] = useState<Notification[]>(unreadNotifications);
  const [localRead, setLocalRead] = useState<Notification[]>(readNotifications);
  
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await axios.post(route('notifications.markAsRead'), {
        notification_id: notificationId
      }, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      
      // Move notification from unread to read
      const notification = localUnread.find(n => n.id === notificationId);
      if (notification) {
        const updatedNotification = { ...notification, read_at: new Date().toISOString() };
        setLocalUnread(prev => prev.filter(n => n.id !== notificationId));
        setLocalRead(prev => [updatedNotification, ...prev]);
      }
      
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(route('notifications.markAllAsRead'), {}, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      
      // Move all unread to read
      const updatedNotifications = localUnread.map(notification => ({
        ...notification,
        read_at: new Date().toISOString()
      }));
      
      setLocalRead(prev => [...updatedNotifications, ...prev]);
      setLocalUnread([]);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };
  
  const handleDeleteNotification = async (notificationId: string, isUnread: boolean) => {
    try {
      await axios.delete(route('notifications.deleteNotification', { notification: notificationId }), {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      
      // Remove notification from the appropriate list
      if (isUnread) {
        setLocalUnread(prev => prev.filter(n => n.id !== notificationId));
      } else {
        setLocalRead(prev => prev.filter(n => n.id !== notificationId));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
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
  
  // Get icon component based on string name
  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'trending-up':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'trending-down':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'user-plus':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'award':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'alert-triangle':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'bar-chart':
      case 'bar-chart-2':
        return <BarChart className="h-5 w-5 text-[#8D5EB7]" />;
      case 'repeat':
        return <Repeat className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            View and manage your notifications
          </CardDescription>
        </div>
        
        {localUnread.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="unread" className="relative">
              Unread
              {localUnread.length > 0 && (
                <Badge 
                  className="ml-2 h-5 px-1.5 bg-[#8D5EB7]"
                  variant="default"
                >
                  {localUnread.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread">
            {localUnread.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-medium">No unread notifications</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {localUnread.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-3 p-3 border rounded-md"
                  >
                    <div className="mt-1">
                      {getIconComponent(notification.data.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{notification.data.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckCheck className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => handleDeleteNotification(notification.id, true)}
                            title="Delete notification"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.data.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </span>
                        {notification.data.action_url && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 text-xs text-[#8D5EB7]"
                            asChild
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Link href={notification.data.action_url}>
                              View Details
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="read">
            {localRead.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-medium">No read notifications</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your read notifications will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {localRead.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-3 p-3 border rounded-md bg-muted/50"
                  >
                    <div className="mt-1">
                      {getIconComponent(notification.data.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{notification.data.title}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => handleDeleteNotification(notification.id, false)}
                          title="Delete notification"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.data.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </span>
                        {notification.data.action_url && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 text-xs text-[#8D5EB7]"
                            asChild
                          >
                            <Link href={notification.data.action_url}>
                              View Details
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
