<?php

namespace App\Http\Controllers\Consumer;

use App\Enums\FulfillmentType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Consumer\PlaceOrderRequest;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderCancelledNotification;
use App\Notifications\OrderPlacedNotification;
use App\Services\OrderPlacementService;
use App\Services\OrderStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $orders = $user->orders()
            ->with('store:id,name')
            ->withCount('items')
            ->latest()
            ->paginate(10)
            ->through(fn (Order $order) => [
                'id' => $order->id,
                'reference' => $order->reference,
                'store_name' => $order->store->name,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'total' => (float) $order->total,
                'items_count' => $order->items_count,
                'created_at' => $order->created_at?->toIso8601String(),
            ]);

        return Inertia::render('consumer/orders/index', [
            'orders' => $orders,
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($order->user_id === $user->id, 403);

        $order->load('items', 'store:id,name,contact_number,address,gcash_number,gcash_qr_path', 'review', 'payments');

        $gcashPayment = $order->payment_method === PaymentMethod::GCash
            ? $order->payments->firstWhere('provider', 'gcash_manual')
            : null;

        return Inertia::render('consumer/orders/show', [
            'order' => [
                'id' => $order->id,
                'reference' => $order->reference,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'fulfillment_type' => $order->fulfillment_type->value,
                'payment_method' => $order->payment_method->value,
                'payment_method_label' => $order->payment_method->label(),
                'payment_status' => $order->payment_status->value,
                'payment_status_label' => $order->payment_status->label(),
                'subtotal' => (float) $order->subtotal,
                'delivery_fee' => (float) $order->delivery_fee,
                'total' => (float) $order->total,
                'delivery_address' => $order->delivery_address,
                'contact_number' => $order->contact_number,
                'notes' => $order->notes,
                'cancellation_reason' => $order->cancellation_reason,
                'can_cancel' => $order->status->isConsumerCancellable(),
                'can_review' => $order->status === OrderStatus::Completed,
                'gcash' => $order->payment_method === PaymentMethod::GCash ? [
                    'number' => $order->store->gcash_number,
                    'qr_url' => $order->store->gcash_qr_path
                        ? Storage::disk('public')->url($order->store->gcash_qr_path)
                        : null,
                    'reference' => $gcashPayment?->provider_reference,
                    'awaiting_payment' => $order->payment_status === PaymentStatus::Pending,
                ] : null,
                'review' => $order->review ? [
                    'rating' => $order->review->rating,
                    'comment' => $order->review->comment,
                ] : null,
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
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'unit' => $item->unit,
                    'unit_price' => (float) $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => (float) $item->line_total,
                ]),
            ],
        ]);
    }

    public function store(PlaceOrderRequest $request, OrderPlacementService $placement): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $order = $placement->place($user, [
            'fulfillment_type' => FulfillmentType::from($validated['fulfillment_type']),
            'payment_method' => PaymentMethod::from($validated['payment_method']),
            'contact_number' => $validated['contact_number'],
            'delivery_address' => $validated['delivery_address'] ?? null,
            'delivery_latitude' => isset($validated['delivery_latitude']) ? (float) $validated['delivery_latitude'] : null,
            'delivery_longitude' => isset($validated['delivery_longitude']) ? (float) $validated['delivery_longitude'] : null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $order->store->user->notify(new OrderPlacedNotification($order));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Order {$order->reference} placed."]);

        return to_route('orders.show', $order);
    }

    public function cancel(Request $request, Order $order, OrderStatusService $status): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($order->user_id === $user->id, 403);

        if (! $order->status->isConsumerCancellable()) {
            throw ValidationException::withMessages([
                'status' => 'This order can no longer be cancelled.',
            ]);
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $status->transition($order, OrderStatus::Cancelled, $validated['reason'] ?? 'Cancelled by customer');

        $order->store->user->notify(new OrderCancelledNotification($order));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Order cancelled.']);

        return back();
    }

    public function submitGcashReference(Request $request, Order $order): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($order->user_id === $user->id, 403);

        if ($order->payment_method !== PaymentMethod::GCash || $order->payment_status !== PaymentStatus::Pending) {
            throw ValidationException::withMessages([
                'reference' => 'This order is not awaiting a GCash reference.',
            ]);
        }

        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:100'],
        ]);

        $payment = $order->payments()->firstOrCreate(
            ['provider' => 'gcash_manual'],
            ['amount' => $order->total, 'status' => 'pending'],
        );
        $payment->update(['provider_reference' => $validated['reference']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Reference submitted — the seller will confirm your payment.']);

        return back();
    }
}
