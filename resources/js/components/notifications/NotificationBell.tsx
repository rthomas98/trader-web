import React, { useState, useEffect } from 'react';
import { Bell, Settings, CheckCheck, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
}

export default function NotificationBell({ notifications = [], unreadCount = 0 }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);
  const [localUnreadCount, setLocalUnreadCount] = useState<number>(unreadCount);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Set up axios defaults for CSRF protection
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
      axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
    
    // Make sure axios includes credentials
    axios.defaults.withCredentials = true;
    
    setLocalNotifications(notifications);
    setLocalUnreadCount(unreadCount);
  }, [notifications, unreadCount]);
  
  // Fetch full notifications when the bell is clicked
  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    
    if (newOpen) {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/notifications');
        if (response.data && Array.isArray(response.data.notifications)) {
          setLocalNotifications(response.data.notifications);
          setLocalUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await axios.post('/api/notifications/mark-as-read', {
        notification_id: notificationId
      });
      
      if (response.data && response.data.success) {
        // Update local state
        setLocalNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read_at: new Date().toISOString() } 
              : notification
          )
        );
        
        setLocalUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const response = await axios.post('/api/notifications/mark-all-as-read');
      
      if (response.data && response.data.success) {
        // Update local state
        setLocalNotifications(prev => 
          prev.map(notification => ({ ...notification, read_at: new Date().toISOString() }))
        );
        
        setLocalUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };
  
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await axios.delete(`/api/notifications/${notificationId}`);
      
      if (response.data && response.data.success) {
        // Update local state
        setLocalNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        
        // Update unread count
        setLocalUnreadCount(response.data.unreadCount);
        
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };
  
  // Get icon component based on string name
  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'trending-up':
        return <div className="text-green-500">↗</div>;
      case 'trending-down':
        return <div className="text-red-500">↘</div>;
      case 'user-plus':
        return <div className="text-blue-500">👤+</div>;
      case 'award':
        return <div className="text-yellow-500">🏆</div>;
      case 'alert-triangle':
        return <div className="text-orange-500">⚠️</div>;
      case 'bar-chart':
      case 'bar-chart-2':
        return <div className="text-purple-500">📊</div>;
      case 'repeat':
        return <div className="text-blue-500">🔄</div>;
      default:
        return <div className="text-gray-500">📣</div>;
    }
  };
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {localUnreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary"
              variant="default"
            >
              {localUnreadCount > 9 ? '9+' : localUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
              disabled={localUnreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
            <Link 
              href={route('notifications.settings')}
              className={cn(
                "inline-flex items-center justify-center h-7 w-7 rounded-md",
                "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
              )}
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <Loader2 className="h-10 w-10 text-muted-foreground mb-2 animate-spin" />
              <p className="text-sm font-medium">Loading notifications...</p>
            </div>
          ) : localNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground">
                You'll see notifications about your trading activity here
              </p>
            </div>
          ) : (
            localNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 border-b hover:bg-accent/50 transition-colors ${notification.read_at ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getIconComponent(notification.data.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm line-clamp-1">{notification.data.title}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {notification.read_at === null && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckCheck className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => handleDeleteNotification(notification.id)}
                          title="Delete notification"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.data.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                      {notification.data.action_url && (
                        <Link 
                          href={notification.data.action_url} 
                          className="text-xs text-primary hover:underline"
                          onClick={() => {
                            setOpen(false);
                            if (notification.read_at === null) {
                              handleMarkAsRead(notification.id);
                            }
                          }}
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
        
        <div className="p-2 border-t">
          <Link 
            href={route('notifications.settings')}
            className={cn(
              "inline-flex items-center justify-center w-full text-xs text-primary",
              "rounded-md h-8 px-3 hover:underline"
            )}
          >
            Manage Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
