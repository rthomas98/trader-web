<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use App\Models\PriceAlert;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display the user's notification settings.
     */
    public function settings(): Response
    {
        $user = Auth::user();
        
        // Get or create notification preferences
        $preferences = $user->notificationPreference;
        
        if (!$preferences) {
            $preferences = NotificationPreference::create([
                'user_id' => $user->id,
                'price_alerts' => true,
                'market_news' => true,
                'trade_executed' => true,
                'trade_closed' => true,
                'stop_loss_hit' => true,
                'take_profit_hit' => true,
                'new_copier' => true,
                'copier_stopped' => true,
                'copy_request_received' => true,
                'copy_request_approved' => true,
                'copy_request_rejected' => true,
                'profit_milestone' => true,
                'loss_milestone' => true,
                'win_streak' => true,
                'drawdown_alert' => true,
                'new_follower' => true,
                'trader_new_trade' => true,
                'trader_performance_update' => true,
                'email_notifications' => true,
                'push_notifications' => true,
                'in_app_notifications' => true,
            ]);
        }
        
        // Get active price alerts
        $priceAlerts = $user->priceAlerts()
            ->where('is_triggered', false)
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Get triggered price alerts
        $triggeredAlerts = $user->priceAlerts()
            ->where('is_triggered', true)
            ->orderBy('triggered_at', 'desc')
            ->limit(10)
            ->get();
            
        // Get unread notifications
        $unreadNotifications = $user->unreadNotifications()
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
            
        // Get read notifications
        $readNotifications = $user->readNotifications()
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        return Inertia::render('Notifications/Settings', [
            'preferences' => $preferences,
            'priceAlerts' => $priceAlerts,
            'triggeredAlerts' => $triggeredAlerts,
            'unreadNotifications' => $unreadNotifications,
            'readNotifications' => $readNotifications,
            'stats' => [
                'unreadCount' => $user->unreadNotifications()->count(),
                'alertsCount' => $priceAlerts->count(),
            ],
        ]);
    }
    
    /**
     * Update the user's notification preferences.
     */
    public function updatePreferences(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        // Validate the request
        $validated = $request->validate([
            // Price and Market Notifications
            'price_alerts' => 'boolean',
            'market_news' => 'boolean',
            
            // Trade Notifications
            'trade_executed' => 'boolean',
            'trade_closed' => 'boolean',
            'stop_loss_hit' => 'boolean',
            'take_profit_hit' => 'boolean',
            
            // Copy Trading Notifications
            'new_copier' => 'boolean',
            'copier_stopped' => 'boolean',
            'copy_request_received' => 'boolean',
            'copy_request_approved' => 'boolean',
            'copy_request_rejected' => 'boolean',
            
            // Performance Notifications
            'profit_milestone' => 'boolean',
            'loss_milestone' => 'boolean',
            'win_streak' => 'boolean',
            'drawdown_alert' => 'boolean',
            
            // Social Notifications
            'new_follower' => 'boolean',
            'trader_new_trade' => 'boolean',
            'trader_performance_update' => 'boolean',
            
            // Delivery Preferences
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'in_app_notifications' => 'boolean',
        ]);
        
        // Get or create notification preferences
        $preferences = $user->notificationPreference;
        if (!$preferences) {
            $preferences = new NotificationPreference(['user_id' => $user->id]);
        }
        
        // Update preferences
        $preferences->fill($validated);
        $preferences->save();
        
        return Redirect::back()->with('success', 'Notification preferences updated successfully.');
    }
    
    /**
     * Create a new price alert.
     */
    public function createPriceAlert(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        // Validate the request
        $validated = $request->validate([
            'symbol' => 'required|string|max:20',
            'condition' => 'required|in:above,below,percent_change',
            'price' => 'required|numeric|min:0',
            'percent_change' => 'nullable|numeric',
            'is_recurring' => 'boolean',
        ]);
        
        // Create the price alert
        $user->priceAlerts()->create($validated);
        
        return Redirect::back()->with('success', 'Price alert created successfully.');
    }
    
    /**
     * Delete a price alert.
     */
    public function deletePriceAlert(PriceAlert $priceAlert): RedirectResponse
    {
        // Ensure the authenticated user owns the price alert
        if ($priceAlert->user_id !== Auth::id()) {
            return Redirect::back()->with('error', 'You are not authorized to delete this price alert.');
        }
        
        $priceAlert->delete();
        
        return Redirect::back()->with('success', 'Price alert deleted successfully.');
    }
    
    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request)
    {
        $user = Auth::user();
        
        // Validate the request
        $validated = $request->validate([
            'notification_id' => 'required|string',
        ]);
        
        // Find and mark the notification as read
        $notification = $user->notifications()->where('id', $validated['notification_id'])->first();
        
        if ($notification) {
            $notification->markAsRead();
            
            // Return JSON response for API requests
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Notification marked as read.',
                    'unreadCount' => $user->unreadNotifications()->count()
                ]);
            }
            
            return Redirect::back()->with('success', 'Notification marked as read.');
        }
        
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found.'
            ], 404);
        }
        
        return Redirect::back()->with('error', 'Notification not found.');
    }
    
    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        $user->unreadNotifications->markAsRead();
        
        // Return JSON response for API requests
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read.',
                'unreadCount' => 0
            ]);
        }
        
        return Redirect::back()->with('success', 'All notifications marked as read.');
    }
    
    /**
     * Delete a notification.
     */
    public function deleteNotification(Request $request, $id = null)
    {
        $user = Auth::user();
        
        // Get notification ID from route parameter or request body
        $notificationId = $id;
        
        // If no ID in route, check request body
        if (!$notificationId) {
            $validated = $request->validate([
                'notification_id' => 'required|string',
            ]);
            $notificationId = $validated['notification_id'];
        }
        
        // Find and delete the notification
        $notification = $user->notifications()->where('id', $notificationId)->first();
        
        if ($notification) {
            $wasUnread = $notification->read_at === null;
            $notification->delete();
            
            // Return JSON response for API requests
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Notification deleted.',
                    'unreadCount' => $wasUnread ? $user->unreadNotifications()->count() : null
                ]);
            }
            
            return Redirect::back()->with('success', 'Notification deleted.');
        }
        
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found.'
            ], 404);
        }
        
        return Redirect::back()->with('error', 'Notification not found.');
    }
    
    /**
     * Get notifications for the authenticated user (API endpoint).
     */
    public function getNotifications()
    {
        $user = Auth::user();
        
        // Get unread notifications
        $unreadNotifications = $user->unreadNotifications()
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
            
        // Get read notifications (only if there are few unread)
        $readNotifications = collect([]);
        if ($unreadNotifications->count() < 10) {
            $readNotifications = $user->readNotifications()
                ->orderBy('created_at', 'desc')
                ->limit(10 - $unreadNotifications->count())
                ->get();
        }
        
        // Combine notifications
        $notifications = $unreadNotifications->concat($readNotifications);
        
        return response()->json([
            'notifications' => $notifications,
            'unreadCount' => $user->unreadNotifications()->count(),
        ]);
    }
    
    /**
     * Get unread notification count for the authenticated user (API endpoint).
     */
    public function getUnreadCount()
    {
        $user = Auth::user();
        
        return response()->json([
            'unreadCount' => $user->unreadNotifications()->count(),
        ]);
    }
}
