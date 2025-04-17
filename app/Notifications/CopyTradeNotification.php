<?php

namespace App\Notifications;

use App\Models\CopyTradingRelationship;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CopyTradeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The copy trading relationship.
     *
     * @var \App\Models\CopyTradingRelationship
     */
    protected $relationship;

    /**
     * The trade details.
     *
     * @var array
     */
    protected $trade;

    /**
     * The notification type.
     *
     * @var string
     */
    protected $type;

    /**
     * Create a new notification instance.
     */
    public function __construct(CopyTradingRelationship $relationship, array $trade = null, string $type = 'started')
    {
        $this->relationship = $relationship;
        $this->trade = $trade;
        $this->type = $type;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $mailMessage = (new MailMessage)
            ->subject($this->getSubject())
            ->greeting('Hello ' . $notifiable->name . '!');

        switch ($this->type) {
            case 'started':
                $mailMessage->line('You have successfully started copying trades from ' . $this->relationship->trader->name . '.')
                    ->line('Risk Allocation: ' . $this->relationship->risk_allocation_percentage . '%')
                    ->line('Copy Fixed Size: ' . ($this->relationship->copy_fixed_size ? 'Yes (' . $this->relationship->fixed_lot_size . ' lots)' : 'No (Proportional)'))
                    ->line('Copy Stop Loss: ' . ($this->relationship->copy_stop_loss ? 'Yes' : 'No'))
                    ->line('Copy Take Profit: ' . ($this->relationship->copy_take_profit ? 'Yes' : 'No'))
                    ->action('Manage Copy Trading', url(route('copy-trading.index')))
                    ->line('Thank you for using our application!');
                break;

            case 'paused':
                $mailMessage->line('You have paused copying trades from ' . $this->relationship->trader->name . '.')
                    ->line('You can resume copying at any time from your copy trading dashboard.')
                    ->action('Manage Copy Trading', url(route('copy-trading.index')))
                    ->line('Thank you for using our application!');
                break;

            case 'resumed':
                $mailMessage->line('You have resumed copying trades from ' . $this->relationship->trader->name . '.')
                    ->line('You will now receive all new trades from this trader based on your risk settings.')
                    ->action('Manage Copy Trading', url(route('copy-trading.index')))
                    ->line('Thank you for using our application!');
                break;

            case 'stopped':
                $mailMessage->line('You have stopped copying trades from ' . $this->relationship->trader->name . '.')
                    ->line('You will no longer receive any trades from this trader.')
                    ->action('Find New Traders', url(route('social.popular')))
                    ->line('Thank you for using our application!');
                break;

            case 'trade_copied':
                if ($this->trade) {
                    $profitColor = $this->trade['profit'] >= 0 ? 'green' : 'red';
                    $profitText = $this->trade['profit'] >= 0 ? 'Profit' : 'Loss';
                    $profitAmount = number_format(abs($this->trade['profit']), 2);

                    $mailMessage->line('A trade has been copied from ' . $this->relationship->trader->name . '.')
                        ->line('Symbol: ' . $this->trade['symbol'])
                        ->line('Type: ' . $this->trade['type'])
                        ->line('Entry Price: ' . number_format($this->trade['entry_price'], 5))
                        ->line('Exit Price: ' . number_format($this->trade['exit_price'], 5))
                        ->line('Lot Size: ' . $this->trade['lot_size'])
                        ->line($profitText . ': <span style="color:' . $profitColor . '">$' . $profitAmount . '</span>')
                        ->action('View Performance', url(route('copy-trading.performance', $this->relationship->id)))
                        ->line('Thank you for using our application!');
                } else {
                    $mailMessage->line('A trade has been copied from ' . $this->relationship->trader->name . '.')
                        ->line('Check your copy trading dashboard for details.')
                        ->action('View Performance', url(route('copy-trading.performance', $this->relationship->id)))
                        ->line('Thank you for using our application!');
                }
                break;

            case 'max_drawdown_reached':
                $mailMessage->line('⚠️ Maximum drawdown reached for copy trading with ' . $this->relationship->trader->name . '.')
                    ->line('Your copy trading has been automatically paused to protect your capital.')
                    ->line('Maximum Drawdown: ' . $this->relationship->max_drawdown_percentage . '%')
                    ->action('Manage Copy Trading', url(route('copy-trading.index')))
                    ->line('You can resume copying at any time from your copy trading dashboard.');
                break;

            default:
                $mailMessage->line('There has been an update to your copy trading relationship with ' . $this->relationship->trader->name . '.')
                    ->action('Manage Copy Trading', url(route('copy-trading.index')))
                    ->line('Thank you for using our application!');
                break;
        }

        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'relationship_id' => $this->relationship->id,
            'trader_id' => $this->relationship->trader_user_id,
            'trader_name' => $this->relationship->trader->name ?? 'Unknown Trader',
            'type' => $this->type,
            'trade' => $this->trade,
        ];
    }

    /**
     * Get the subject for the notification.
     */
    protected function getSubject(): string
    {
        $traderName = $this->relationship->trader->name ?? 'a trader';

        switch ($this->type) {
            case 'started':
                return 'Copy Trading Started - ' . $traderName;
            case 'paused':
                return 'Copy Trading Paused - ' . $traderName;
            case 'resumed':
                return 'Copy Trading Resumed - ' . $traderName;
            case 'stopped':
                return 'Copy Trading Stopped - ' . $traderName;
            case 'trade_copied':
                $symbol = $this->trade['symbol'] ?? '';
                $profitLoss = isset($this->trade['profit']) ? ($this->trade['profit'] >= 0 ? 'Profit' : 'Loss') : '';
                return "Trade Copied - {$symbol} {$profitLoss}";
            case 'max_drawdown_reached':
                return '⚠️ Maximum Drawdown Reached - Copy Trading Paused';
            default:
                return 'Copy Trading Update - ' . $traderName;
        }
    }
}
