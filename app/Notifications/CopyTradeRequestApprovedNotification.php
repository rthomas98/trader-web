<?php

namespace App\Notifications;

use App\Models\CopyTradingRelationship;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CopyTradeRequestApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        protected CopyTradingRelationship $relationship
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $trader = $this->relationship->trader;
        
        return (new MailMessage)
            ->subject('Copy Trading Request Approved')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line($trader->name . ' has approved your request to copy their trades.')
            ->line('You are now actively copying their trades based on your settings.')
            ->action('View Copy Trading', url(route('copy-trading.index')))
            ->line('Thank you for using our trading platform!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $trader = $this->relationship->trader;
        
        return [
            'title' => 'Copy Trading Request Approved',
            'message' => $trader->name . ' has approved your request to copy their trades.',
            'action_url' => route('copy-trading.index'),
            'relationship_id' => $this->relationship->id,
            'trader_id' => $trader->id,
            'trader_name' => $trader->name,
        ];
    }
}
