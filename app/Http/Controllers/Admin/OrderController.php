<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString() ?: null;
        $status = $request->string('status')->toString() ?: null;
        $dateFrom = $request->date('date_from');
        $dateTo = $request->date('date_to');

        $orders = Order::query()
            ->with(['store:id,name', 'user:id,first_name,last_name'])
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('store', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('user', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%"));
            }))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Order $order) => [
                'id' => $order->id,
                'reference' => $order->reference,
                'store_name' => $order->store->name,
                'customer_name' => trim("{$order->user->first_name} {$order->user->last_name}"),
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'payment_method' => $order->payment_method->value,
                'payment_status' => $order->payment_status->value,
                'total' => (float) $order->total,
                'created_at' => $order->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'date_from' => $request->string('date_from')->toString() ?: '',
                'date_to' => $request->string('date_to')->toString() ?: '',
            ],
            'statusOptions' => collect(OrderStatus::cases())->map(fn (OrderStatus $s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['items', 'store:id,name,contact_number,address', 'user:id,first_name,last_name,email', 'review', 'payments']);

        $gcashReference = $order->payment_method === PaymentMethod::GCash
            ? $order->payments->firstWhere('provider', 'gcash_manual')?->provider_reference
            : null;

        return Inertia::render('admin/orders/show', [
            'order' => [
                'id' => $order->id,
                'reference' => $order->reference,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'fulfillment_type' => $order->fulfillment_type->value,
                'payment_method_label' => $order->payment_method->label(),
                'payment_status_label' => $order->payment_status->label(),
                'gcash_reference' => $gcashReference,
                'subtotal' => (float) $order->subtotal,
                'delivery_fee' => (float) $order->delivery_fee,
                'total' => (float) $order->total,
                'delivery_address' => $order->delivery_address,
                'contact_number' => $order->contact_number,
                'notes' => $order->notes,
                'cancellation_reason' => $order->cancellation_reason,
                'created_at' => $order->created_at?->toIso8601String(),
                'confirmed_at' => $order->confirmed_at?->toIso8601String(),
                'completed_at' => $order->completed_at?->toIso8601String(),
                'cancelled_at' => $order->cancelled_at?->toIso8601String(),
                'store' => [
                    'id' => $order->store->id,
                    'name' => $order->store->name,
                    'address' => $order->store->address,
                    'contact_number' => $order->store->contact_number,
                ],
                'customer' => [
                    'name' => trim("{$order->user->first_name} {$order->user->last_name}"),
                    'email' => $order->user->email,
                ],
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'unit' => $item->unit,
                    'unit_price' => (float) $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => (float) $item->line_total,
                ]),
                'review' => $order->review ? [
                    'rating' => $order->review->rating,
                    'comment' => $order->review->comment,
                ] : null,
            ],
        ]);
    }
}
