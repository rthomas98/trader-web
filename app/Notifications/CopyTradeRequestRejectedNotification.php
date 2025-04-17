<?php

namespace App\Notifications;

use App\Models\CopyTradingRelationship;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CopyTradeRequestRejectedNotification extends Notification implements ShouldQueue
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
            ->subject('Copy Trading Request Rejected')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line($trader->name . ' has rejected your request to copy their trades.')
            ->line('You can explore other traders to copy on the platform.')
            ->action('Find Traders', url(route('social-trading.index')))
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
            'title' => 'Copy Trading Request Rejected',
            'message' => $trader->name . ' has rejected your request to copy their trades.',
            'action_url' => route('social-trading.index'),
            'relationship_id' => $this->relationship->id,
            'trader_id' => $trader->id,
            'trader_name' => $trader->name,
        ];
    }
}
