<?php

namespace App\Notifications;

use App\Models\PriceAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PriceAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        protected PriceAlert $priceAlert,
        protected float $currentPrice
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
            if ($preferences->email_notifications && $preferences->price_alerts) {
                $channels[] = 'mail';
            }
            
            if ($preferences->push_notifications && $preferences->price_alerts) {
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
        $condition = $this->priceAlert->condition === 'above' ? 'risen above' : 'fallen below';
        
        if ($this->priceAlert->condition === 'percent_change') {
            $direction = $this->currentPrice > $this->priceAlert->price ? 'increased' : 'decreased';
            $percentChange = abs(($this->currentPrice - $this->priceAlert->price) / $this->priceAlert->price * 100);
            $condition = "$direction by " . number_format($percentChange, 2) . '%';
        }
        
        return (new MailMessage)
            ->subject("Price Alert: {$this->priceAlert->symbol} has {$condition} your target")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your price alert for {$this->priceAlert->symbol} has been triggered.")
            ->line("The price has {$condition} your target of " . number_format($this->priceAlert->price, 5) . ".")
            ->line("Current price: " . number_format($this->currentPrice, 5))
            ->action('View Markets', url('/markets'))
            ->line('Thank you for using our trading platform!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $condition = $this->priceAlert->condition === 'above' ? 'risen above' : 'fallen below';
        
        if ($this->priceAlert->condition === 'percent_change') {
            $direction = $this->currentPrice > $this->priceAlert->price ? 'increased' : 'decreased';
            $percentChange = abs(($this->currentPrice - $this->priceAlert->price) / $this->priceAlert->price * 100);
            $condition = "$direction by " . number_format($percentChange, 2) . '%';
        }
        
        return [
            'title' => "Price Alert: {$this->priceAlert->symbol}",
            'message' => "The price of {$this->priceAlert->symbol} has {$condition} your target of " . number_format($this->priceAlert->price, 5) . ".",
            'price_alert_id' => $this->priceAlert->id,
            'symbol' => $this->priceAlert->symbol,
            'target_price' => $this->priceAlert->price,
            'current_price' => $this->currentPrice,
            'action_url' => '/markets',
            'icon' => 'trending-up',
            'color' => 'primary',
        ];
    }
}
