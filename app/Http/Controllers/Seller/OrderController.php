<?php

namespace App\Http\Controllers\Seller;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Notifications\OrderStatusUpdatedNotification;
use App\Services\OrderStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $store = $this->store($request);
        $status = $request->string('status')->toString() ?: null;

        $orders = $store->orders()
            ->when($status, fn ($q) => $q->where('status', $status))
            ->with('user:id,first_name,last_name')
            ->withCount('items')
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Order $order) => [
                'id' => $order->id,
                'reference' => $order->reference,
                'customer_name' => trim("{$order->user->first_name} {$order->user->last_name}"),
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'fulfillment_type' => $order->fulfillment_type->value,
                'payment_status' => $order->payment_status->value,
                'total' => (float) $order->total,
                'items_count' => $order->items_count,
                'created_at' => $order->created_at?->toIso8601String(),
            ]);

        return Inertia::render('seller/orders/index', [
            'orders' => $orders,
            'filters' => ['status' => $status ?? ''],
            'statusCounts' => $this->statusCounts($store),
            'statusOptions' => collect(OrderStatus::cases())->map(fn (OrderStatus $s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
        ]);
    }

    public function show(Request $request, Order $order, OrderStatusService $status): Response
    {
        $this->authorizeOrder($request, $order);
        $order->load('items', 'user:id,first_name,last_name', 'review', 'payments');

        $next = $status->nextStatus($order);
        $gcashReference = $order->payment_method === PaymentMethod::GCash
            ? $order->payments->firstWhere('provider', 'gcash_manual')?->provider_reference
            : null;

        return Inertia::render('seller/orders/show', [
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
                'customer_name' => trim("{$order->user->first_name} {$order->user->last_name}"),
                'created_at' => $order->created_at?->toIso8601String(),
                'confirmed_at' => $order->confirmed_at?->toIso8601String(),
                'completed_at' => $order->completed_at?->toIso8601String(),
                'cancelled_at' => $order->cancelled_at?->toIso8601String(),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'unit' => $item->unit,
                    'unit_price' => (float) $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => (float) $item->line_total,
                ]),
                'can_confirm' => $order->status === OrderStatus::Pending,
                'can_reject' => $order->status === OrderStatus::Pending,
                'next_status' => $next?->value,
                'next_status_label' => $next?->label(),
                'can_mark_paid' => in_array($order->payment_status, [PaymentStatus::Unpaid, PaymentStatus::Pending], true)
                    && ! $order->status->isTerminal(),
                'gcash_reference' => $gcashReference,
                'review' => $order->review ? [
                    'rating' => $order->review->rating,
                    'comment' => $order->review->comment,
                ] : null,
            ],
        ]);
    }

    public function confirm(Request $request, Order $order, OrderStatusService $status): RedirectResponse
    {
        $this->authorizeOrder($request, $order);
        $status->transition($order, OrderStatus::Confirmed);

        $order->user->notify(new OrderStatusUpdatedNotification($order));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Order confirmed.']);

        return back();
    }

    public function reject(Request $request, Order $order, OrderStatusService $status): RedirectResponse
    {
        $this->authorizeOrder($request, $order);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $status->transition($order, OrderStatus::Rejected, $validated['reason']);

        $order->user->notify(new OrderStatusUpdatedNotification($order));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Order rejected.']);

        return back();
    }

    public function advance(Request $request, Order $order, OrderStatusService $status): RedirectResponse
    {
        $this->authorizeOrder($request, $order);

        $next = $status->nextStatus($order);

        if ($next === null) {
            throw ValidationException::withMessages([
                'status' => 'This order cannot be advanced further.',
            ]);
        }

        // GCash is paid online first — don't let a seller complete it before confirming receipt.
        if ($next === OrderStatus::Completed
            && $order->payment_method === PaymentMethod::GCash
            && $order->payment_status !== PaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'status' => 'Confirm the GCash payment before completing this order.',
            ]);
        }

        $status->transition($order, $next);

        // Cash is collected on handover: completing settles the payment.
        if ($next === OrderStatus::Completed
            && $order->payment_method === PaymentMethod::Cash
            && $order->payment_status === PaymentStatus::Unpaid) {
            $order->update(['payment_status' => PaymentStatus::Paid]);
        }

        // Notify the consumer on customer-facing milestones (not internal "preparing").
        if (in_array($next, [OrderStatus::ReadyForPickup, OrderStatus::OutForDelivery, OrderStatus::Completed], true)) {
            $order->user->notify(new OrderStatusUpdatedNotification($order));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "Order marked {$next->label()}."]);

        return back();
    }

    public function markPaid(Request $request, Order $order): RedirectResponse
    {
        $this->authorizeOrder($request, $order);

        $collectable = in_array($order->payment_status, [PaymentStatus::Unpaid, PaymentStatus::Pending], true);

        if (! $collectable || $order->status->isTerminal()) {
            throw ValidationException::withMessages([
                'payment_status' => 'This order cannot be marked as paid.',
            ]);
        }

        $order->update(['payment_status' => PaymentStatus::Paid]);
        $order->payments()->where('provider', 'gcash_manual')->update(['status' => 'paid']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment recorded.']);

        return back();
    }

    private function store(Request $request): Store
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Store $store */
        $store = $user->store;

        return $store;
    }

    private function authorizeOrder(Request $request, Order $order): void
    {
        abort_unless($order->store_id === $this->store($request)->id, 403);
    }

    /**
     * @return array<string, int>
     */
    private function statusCounts(Store $store): array
    {
        $counts = $store->orders()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return [
            'all' => (int) $counts->sum(),
            'pending' => (int) $counts->get(OrderStatus::Pending->value, 0),
            'confirmed' => (int) $counts->get(OrderStatus::Confirmed->value, 0),
            'preparing' => (int) $counts->get(OrderStatus::Preparing->value, 0),
        ];
    }
}
