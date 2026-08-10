<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the store's seller when the consumer cancels their own order.
 */
class OrderCancelledNotification extends Notification implements ShouldQueue
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
            ->subject("Order {$this->order->reference} cancelled")
            ->line("Order {$this->order->reference} was cancelled by the customer.".
                ($this->order->cancellation_reason ? " Reason: {$this->order->cancellation_reason}" : ''))
            ->action('View order', url(route('seller.orders.show', $this->order)));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_cancelled',
            'message' => "Order {$this->order->reference} was cancelled by the customer.",
            'order_id' => $this->order->id,
            'order_reference' => $this->order->reference,
            'url' => route('seller.orders.show', $this->order, false),
        ];
    }
}
