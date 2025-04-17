<?php

namespace App\Notifications;

use App\Models\Trade;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TradeExecutedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        protected Trade $trade,
        protected bool $isCopied = false
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
            if ($preferences->email_notifications && $preferences->trade_executed) {
                $channels[] = 'mail';
            }
            
            if ($preferences->push_notifications && $preferences->trade_executed) {
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
        $tradeType = $this->trade->type === 'BUY' ? 'Buy' : 'Sell';
        $copiedText = $this->isCopied ? ' (Copied Trade)' : '';
        
        return (new MailMessage)
            ->subject("Trade Executed: {$tradeType} {$this->trade->symbol}{$copiedText}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your {$tradeType} order for {$this->trade->lot_size} lots of {$this->trade->symbol} has been executed{$copiedText}.")
            ->line("Entry Price: " . number_format($this->trade->entry_price, 5))
            ->line("Stop Loss: " . ($this->trade->stop_loss ? number_format($this->trade->stop_loss, 5) : 'Not set'))
            ->line("Take Profit: " . ($this->trade->take_profit ? number_format($this->trade->take_profit, 5) : 'Not set'))
            ->action('View Trade', url('/trades/' . $this->trade->id))
            ->line('Thank you for using our trading platform!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $tradeType = $this->trade->type === 'BUY' ? 'Buy' : 'Sell';
        $copiedText = $this->isCopied ? ' (Copied Trade)' : '';
        
        return [
            'title' => "Trade Executed{$copiedText}",
            'message' => "{$tradeType} {$this->trade->lot_size} lots of {$this->trade->symbol} at " . number_format($this->trade->entry_price, 5),
            'trade_id' => $this->trade->id,
            'symbol' => $this->trade->symbol,
            'type' => $this->trade->type,
            'lot_size' => $this->trade->lot_size,
            'entry_price' => $this->trade->entry_price,
            'stop_loss' => $this->trade->stop_loss,
            'take_profit' => $this->trade->take_profit,
            'is_copied' => $this->isCopied,
            'action_url' => '/trades/' . $this->trade->id,
            'icon' => $this->trade->type === 'BUY' ? 'trending-up' : 'trending-down',
            'color' => $this->trade->type === 'BUY' ? 'green' : 'red',
        ];
    }
}
