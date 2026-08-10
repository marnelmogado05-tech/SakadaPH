<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to platform admins when a new seller registers and needs approval.
 */
class SellerRegisteredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Store $store) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New seller registration: {$this->store->name}")
            ->line("{$this->store->name} has registered and is awaiting approval.")
            ->action('Review sellers', url(route('admin.sellers.index', ['status' => 'pending'])));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'seller_registered',
            'store_id' => $this->store->id,
            'store_name' => $this->store->name,
            'message' => "New seller \"{$this->store->name}\" registered and is awaiting approval.",
            'url' => route('admin.sellers.index', ['status' => 'pending'], false),
            'url_label' => 'Review sellers',
        ];
    }
}
