<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SellerRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(public Store $store) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'seller_rejected',
            'store_id' => $this->store->id,
            'store_name' => $this->store->name,
            'message' => "Your store \"{$this->store->name}\" was not approved. Reason: {$this->store->rejection_reason}",
        ];
    }
}
