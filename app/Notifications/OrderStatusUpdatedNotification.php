<?php

namespace App\Notifications;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the consumer when the seller advances or rejects their order.
 * The event `type` and copy are derived from the order's current status.
 */
class OrderStatusUpdatedNotification extends Notification implements ShouldQueue
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
            ->subject("Order {$this->order->reference}: {$this->order->status->label()}")
            ->line($this->message())
            ->action('View order', url(route('orders.show', $this->order)));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type(),
            'message' => $this->message(),
            'order_id' => $this->order->id,
            'order_reference' => $this->order->reference,
            'url' => route('orders.show', $this->order, false),
        ];
    }

    /**
     * The notification-bell event type for the current order status.
     */
    private function type(): string
    {
        return match ($this->order->status) {
            OrderStatus::Confirmed => 'order_confirmed',
            OrderStatus::ReadyForPickup => 'order_ready',
            OrderStatus::OutForDelivery => 'order_out_for_delivery',
            OrderStatus::Completed => 'order_completed',
            OrderStatus::Rejected => 'order_rejected',
            default => 'order_updated',
        };
    }

    private function message(): string
    {
        $reference = $this->order->reference;
        $store = $this->order->store->name;

        return match ($this->order->status) {
            OrderStatus::Confirmed => "Your order {$reference} was confirmed by {$store}.",
            OrderStatus::ReadyForPickup => "Your order {$reference} is ready for pickup at {$store}.",
            OrderStatus::OutForDelivery => "Your order {$reference} is out for delivery.",
            OrderStatus::Completed => "Your order {$reference} is complete. Thanks for ordering from {$store}!",
            OrderStatus::Rejected => "Your order {$reference} was rejected by {$store}.".
                ($this->order->cancellation_reason ? " Reason: {$this->order->cancellation_reason}" : ''),
            default => "Your order {$reference} was updated.",
        };
    }
}
