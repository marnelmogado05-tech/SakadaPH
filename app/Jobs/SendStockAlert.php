<?php

namespace App\Jobs;

use App\Models\Product;
use App\Notifications\StockRestoredNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendStockAlert implements ShouldQueue
{
    use Queueable;

    public function __construct(public Product $product) {}

    public function handle(): void
    {
        $store = $this->product->store()->with('followers')->first();

        foreach ($store->followers as $follower) {
            $follower->notify(new StockRestoredNotification($store, $this->product->name));
        }
    }
}
