<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SellerApprovedNotification extends Notification
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
            'type' => 'seller_approved',
            'store_id' => $this->store->id,
            'store_name' => $this->store->name,
            'message' => "Your store \"{$this->store->name}\" has been approved. You can now manage your products.",
        ];
    }
}
