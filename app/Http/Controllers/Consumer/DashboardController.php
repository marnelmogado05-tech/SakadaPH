<?php

namespace App\Http\Controllers\Consumer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $recentOrders = $user->orders()
            ->with('store:id,name')
            ->withCount('items')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'reference' => $order->reference,
                'store_name' => $order->store->name,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'total' => (float) $order->total,
                'items_count' => $order->items_count,
                'created_at' => $order->created_at?->toIso8601String(),
            ]);

        return Inertia::render('dashboard', [
            'stats' => [
                'total_orders' => $user->orders()->count(),
                'active_orders' => $user->orders()->whereNotIn('status', [
                    OrderStatus::Completed,
                    OrderStatus::Cancelled,
                    OrderStatus::Rejected,
                ])->count(),
                'completed_orders' => $user->orders()->where('status', OrderStatus::Completed)->count(),
                'total_spent' => (float) $user->orders()->where('payment_status', PaymentStatus::Paid)->sum('total'),
            ],
            'recent_orders' => $recentOrders,
        ]);
    }
}
