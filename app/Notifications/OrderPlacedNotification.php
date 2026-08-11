<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the store's seller when a consumer places a new order.
 */
class OrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New order {$this->order->reference}")
            ->greeting('You have a new order!')
            ->line("Order {$this->order->reference} was placed for ₱".number_format((float) $this->order->total, 2).'.')
            ->action('View order', url(route('seller.orders.show', $this->order)));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $customer = trim("{$this->order->user->first_name} {$this->order->user->last_name}");

        return [
            'type' => 'order_placed',
            'message' => "New order {$this->order->reference} from {$customer}.",
            'order_id' => $this->order->id,
            'order_reference' => $this->order->reference,
            'url' => route('seller.orders.show', $this->order, false),
        ];
    }
}
