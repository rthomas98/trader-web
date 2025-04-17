<?php

namespace App\Notifications;

use App\Models\CopyTradingRelationship;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewCopierNotification extends Notification implements ShouldQueue
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
        $copier = $this->relationship->copier;
        
        return (new MailMessage)
            ->subject('New Copy Trader')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line($copier->name . ' has started copying your trades.')
            ->line('You can view and manage your copiers in your copy trading settings.')
            ->action('Manage Copiers', url(route('copy-trading.settings')))
            ->line('Thank you for using our trading platform!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $copier = $this->relationship->copier;
        
        return [
            'title' => 'New Copy Trader',
            'message' => $copier->name . ' has started copying your trades.',
            'action_url' => route('copy-trading.settings'),
            'relationship_id' => $this->relationship->id,
            'copier_id' => $copier->id,
            'copier_name' => $copier->name,
        ];
    }
}
