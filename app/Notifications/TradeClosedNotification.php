<?php

namespace App\Notifications;

use App\Models\Trade;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TradeClosedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        protected Trade $trade,
        protected bool $isCopied = false,
        protected ?string $closeReason = null
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
            if ($preferences->email_notifications) {
                // Check specific preference based on close reason
                if (
                    ($this->closeReason === 'stop_loss' && $preferences->stop_loss_hit) ||
                    ($this->closeReason === 'take_profit' && $preferences->take_profit_hit) ||
                    ($preferences->trade_closed)
                ) {
                    $channels[] = 'mail';
                }
            }
            
            if ($preferences->push_notifications) {
                // Check specific preference based on close reason
                if (
                    ($this->closeReason === 'stop_loss' && $preferences->stop_loss_hit) ||
                    ($this->closeReason === 'take_profit' && $preferences->take_profit_hit) ||
                    ($preferences->trade_closed)
                ) {
                    $channels[] = 'broadcast';
                }
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
        $profitLoss = $this->trade->profit >= 0 ? 'Profit' : 'Loss';
        $reasonText = '';
        
        if ($this->closeReason === 'stop_loss') {
            $reasonText = ' (Stop Loss Triggered)';
        } elseif ($this->closeReason === 'take_profit') {
            $reasonText = ' (Take Profit Triggered)';
        }
        
        $mail = (new MailMessage)
            ->subject("Trade Closed: {$tradeType} {$this->trade->symbol}{$copiedText}{$reasonText}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your {$tradeType} trade for {$this->trade->lot_size} lots of {$this->trade->symbol} has been closed{$copiedText}{$reasonText}.")
            ->line("Entry Price: " . number_format($this->trade->entry_price, 5))
            ->line("Exit Price: " . number_format($this->trade->exit_price, 5))
            ->line("{$profitLoss}: " . ($this->trade->profit >= 0 ? '+' : '') . number_format($this->trade->profit, 2))
            ->action('View Trade History', url('/trades/history'))
            ->line('Thank you for using our trading platform!');
            
        // Add color styling based on profit/loss
        if ($this->trade->profit >= 0) {
            $mail->success();
        } else {
            $mail->error();
        }
        
        return $mail;
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
        $reasonText = '';
        
        if ($this->closeReason === 'stop_loss') {
            $reasonText = ' - Stop Loss Triggered';
        } elseif ($this->closeReason === 'take_profit') {
            $reasonText = ' - Take Profit Triggered';
        }
        
        return [
            'title' => "Trade Closed{$copiedText}{$reasonText}",
            'message' => "{$tradeType} {$this->trade->lot_size} lots of {$this->trade->symbol} closed with " . 
                         ($this->trade->profit >= 0 ? '+' : '') . number_format($this->trade->profit, 2) . " profit",
            'trade_id' => $this->trade->id,
            'symbol' => $this->trade->symbol,
            'type' => $this->trade->type,
            'lot_size' => $this->trade->lot_size,
            'entry_price' => $this->trade->entry_price,
            'exit_price' => $this->trade->exit_price,
            'profit' => $this->trade->profit,
            'is_copied' => $this->isCopied,
            'close_reason' => $this->closeReason,
            'action_url' => '/trades/history',
            'icon' => $this->trade->profit >= 0 ? 'trending-up' : 'trending-down',
            'color' => $this->trade->profit >= 0 ? 'green' : 'red',
        ];
    }
}
