<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SocialInteractionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        protected string $interactionType,
        protected User $fromUser,
        protected ?array $additionalData = []
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        
        // Check user preferences
        $preferences = $notifiable->notificationPreference;
        
        if ($preferences) {
            $preferenceField = match($this->interactionType) {
                'new_follower' => 'new_follower',
                'trader_new_trade' => 'trader_new_trade',
                'trader_performance_update' => 'trader_performance_update',
                default => null
            };
            
            if ($preferenceField && $preferences->email_notifications && $preferences->$preferenceField) {
                $channels[] = 'mail';
            }
            
            if ($preferenceField && $preferences->push_notifications && $preferences->$preferenceField) {
                $channels[] = 'broadcast';
            }
        }
        
        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $title = match($this->interactionType) {
            'new_follower' => 'New Follower',
            'trader_new_trade' => 'Trader You Follow Made a Trade',
            'trader_performance_update' => 'Trader Performance Update',
            default => 'Social Trading Update'
        };
        
        $message = match($this->interactionType) {
            'new_follower' => "{$this->fromUser->name} is now following you",
            'trader_new_trade' => "{$this->fromUser->name} has executed a new trade",
            'trader_performance_update' => "{$this->fromUser->name}'s performance has been updated",
            default => "Social trading update from {$this->fromUser->name}"
        };
        
        $actionText = match($this->interactionType) {
            'new_follower' => 'View Profile',
            'trader_new_trade' => 'View Trade',
            'trader_performance_update' => 'View Performance',
            default => 'View Details'
        };
        
        $actionUrl = match($this->interactionType) {
            'new_follower' => "/social/profile/{$this->fromUser->id}",
            'trader_new_trade' => isset($this->additionalData['trade_id']) ? "/trades/{$this->additionalData['trade_id']}" : "/social/profile/{$this->fromUser->id}",
            'trader_performance_update' => "/social/profile/{$this->fromUser->id}/performance",
            default => "/social/profile/{$this->fromUser->id}"
        };
        
        $mail = (new MailMessage)
            ->subject($title)
            ->greeting("Hello {$notifiable->name},")
            ->line($message);
            
        // Add additional details if available
        if ($this->interactionType === 'trader_new_trade' && isset($this->additionalData['trade_details'])) {
            $tradeDetails = $this->additionalData['trade_details'];
            $mail->line("Trade: {$tradeDetails['type']} {$tradeDetails['symbol']} ({$tradeDetails['lot_size']} lots)");
            
            if (isset($tradeDetails['entry_price'])) {
                $mail->line("Entry Price: " . number_format($tradeDetails['entry_price'], 5));
            }
        }
        
        if ($this->interactionType === 'trader_performance_update' && isset($this->additionalData['performance'])) {
            $performance = $this->additionalData['performance'];
            $mail->line("Monthly Return: " . ($performance['monthly_return'] >= 0 ? '+' : '') . number_format($performance['monthly_return'], 2) . '%');
            $mail->line("Win Rate: {$performance['win_rate']}%");
        }
        
        $mail->action($actionText, url($actionUrl))
            ->line('Thank you for using our trading platform!');
        
        return $mail;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $title = match($this->interactionType) {
            'new_follower' => 'New Follower',
            'trader_new_trade' => 'Trader You Follow Made a Trade',
            'trader_performance_update' => 'Trader Performance Update',
            default => 'Social Trading Update'
        };
        
        $message = match($this->interactionType) {
            'new_follower' => "{$this->fromUser->name} is now following you",
            'trader_new_trade' => "{$this->fromUser->name} has executed a new trade",
            'trader_performance_update' => "{$this->fromUser->name}'s performance has been updated",
            default => "Social trading update from {$this->fromUser->name}"
        };
        
        $icon = match($this->interactionType) {
            'new_follower' => 'user-plus',
            'trader_new_trade' => 'repeat',
            'trader_performance_update' => 'bar-chart-2',
            default => 'users'
        };
        
        $actionUrl = match($this->interactionType) {
            'new_follower' => "/social/profile/{$this->fromUser->id}",
            'trader_new_trade' => isset($this->additionalData['trade_id']) ? "/trades/{$this->additionalData['trade_id']}" : "/social/profile/{$this->fromUser->id}",
            'trader_performance_update' => "/social/profile/{$this->fromUser->id}/performance",
            default => "/social/profile/{$this->fromUser->id}"
        };
        
        return [
            'title' => $title,
            'message' => $message,
            'interaction_type' => $this->interactionType,
            'from_user_id' => $this->fromUser->id,
            'from_user_name' => $this->fromUser->name,
            'additional_data' => $this->additionalData,
            'action_url' => $actionUrl,
            'icon' => $icon,
            'color' => '#8D5EB7', // Using brand color
        ];
    }
}
