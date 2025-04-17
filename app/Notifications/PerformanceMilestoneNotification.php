<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PerformanceMilestoneNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        protected string $milestoneType,
        protected float $value,
        protected array $additionalData = []
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
            $preferenceField = match($this->milestoneType) {
                'profit_milestone' => 'profit_milestone',
                'loss_milestone' => 'loss_milestone',
                'win_streak' => 'win_streak',
                'drawdown_alert' => 'drawdown_alert',
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
        $title = match($this->milestoneType) {
            'profit_milestone' => 'Profit Milestone Reached',
            'loss_milestone' => 'Loss Threshold Reached',
            'win_streak' => 'Win Streak Achievement',
            'drawdown_alert' => 'Drawdown Alert',
            default => 'Trading Performance Update'
        };
        
        $message = match($this->milestoneType) {
            'profit_milestone' => "Congratulations! Your trading account has reached a profit milestone of $" . number_format($this->value, 2),
            'loss_milestone' => "Alert: Your trading account has reached a loss threshold of $" . number_format($this->value, 2),
            'win_streak' => "Congratulations! You've achieved a win streak of {$this->value} consecutive profitable trades",
            'drawdown_alert' => "Alert: Your account is experiencing a drawdown of " . number_format($this->value, 2) . "%",
            default => "Trading performance update: " . number_format($this->value, 2)
        };
        
        $mail = (new MailMessage)
            ->subject($title)
            ->greeting("Hello {$notifiable->name},")
            ->line($message);
            
        // Add additional details if available
        if (isset($this->additionalData['period'])) {
            $mail->line("Time period: {$this->additionalData['period']}");
        }
        
        if (isset($this->additionalData['details'])) {
            $mail->line($this->additionalData['details']);
        }
        
        $mail->action('View Performance Dashboard', url('/dashboard/performance'))
            ->line('Thank you for using our trading platform!');
            
        // Style based on milestone type
        if (in_array($this->milestoneType, ['profit_milestone', 'win_streak'])) {
            $mail->success();
        } elseif (in_array($this->milestoneType, ['loss_milestone', 'drawdown_alert'])) {
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
        $title = match($this->milestoneType) {
            'profit_milestone' => 'Profit Milestone Reached',
            'loss_milestone' => 'Loss Threshold Reached',
            'win_streak' => 'Win Streak Achievement',
            'drawdown_alert' => 'Drawdown Alert',
            default => 'Trading Performance Update'
        };
        
        $message = match($this->milestoneType) {
            'profit_milestone' => "Congratulations! Your trading account has reached a profit milestone of $" . number_format($this->value, 2),
            'loss_milestone' => "Alert: Your trading account has reached a loss threshold of $" . number_format($this->value, 2),
            'win_streak' => "Congratulations! You've achieved a win streak of {$this->value} consecutive profitable trades",
            'drawdown_alert' => "Alert: Your account is experiencing a drawdown of " . number_format($this->value, 2) . "%",
            default => "Trading performance update: " . number_format($this->value, 2)
        };
        
        $icon = match($this->milestoneType) {
            'profit_milestone' => 'trending-up',
            'loss_milestone' => 'trending-down',
            'win_streak' => 'award',
            'drawdown_alert' => 'alert-triangle',
            default => 'bar-chart'
        };
        
        $color = match($this->milestoneType) {
            'profit_milestone', 'win_streak' => 'green',
            'loss_milestone', 'drawdown_alert' => 'red',
            default => 'primary'
        };
        
        return [
            'title' => $title,
            'message' => $message,
            'milestone_type' => $this->milestoneType,
            'value' => $this->value,
            'additional_data' => $this->additionalData,
            'action_url' => '/dashboard/performance',
            'icon' => $icon,
            'color' => $color,
        ];
    }
}
