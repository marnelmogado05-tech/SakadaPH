<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StockRestoredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Store $store, public string $productName) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Stock restored: {$this->productName} at {$this->store->name}")
            ->greeting('Good news!')
            ->line("{$this->productName} at {$this->store->name} is now back in stock.")
            ->action('View store', url("/stores/{$this->store->id}"))
            ->line('You are receiving this because you follow this store.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'stock_restored',
            'store_id' => $this->store->id,
            'store_name' => $this->store->name,
            'product_name' => $this->productName,
            'message' => "{$this->productName} at {$this->store->name} is back in stock.",
        ];
    }
}
