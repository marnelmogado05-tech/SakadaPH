<?php

namespace App\Services;

use App\Enums\FulfillmentType;
use App\Enums\OrderStatus;
use App\Models\Order;

class OrderStatusService
{
    /**
     * Allowed forward transitions per status. Fulfillment-specific edges out of
     * `preparing` are further constrained in {@see canTransition()}.
     *
     * @return array<value-of<OrderStatus>, array<int, OrderStatus>>
     */
    public function transitionMap(): array
    {
        return [
            OrderStatus::PendingPayment->value => [OrderStatus::Pending, OrderStatus::Cancelled],
            OrderStatus::Pending->value => [OrderStatus::Confirmed, OrderStatus::Rejected, OrderStatus::Cancelled],
            OrderStatus::Confirmed->value => [OrderStatus::Preparing],
            OrderStatus::Preparing->value => [OrderStatus::ReadyForPickup, OrderStatus::OutForDelivery],
            OrderStatus::ReadyForPickup->value => [OrderStatus::Completed],
            OrderStatus::OutForDelivery->value => [OrderStatus::Completed],
            OrderStatus::Completed->value => [],
            OrderStatus::Cancelled->value => [],
            OrderStatus::Rejected->value => [],
        ];
    }

    /**
     * The natural next status when a seller advances fulfillment, or null if the
     * order is at a stage with no single forward step (terminal, or pending which
     * branches into confirm/reject).
     */
    public function nextStatus(Order $order): ?OrderStatus
    {
        return match ($order->status) {
            OrderStatus::Confirmed => OrderStatus::Preparing,
            OrderStatus::Preparing => $order->fulfillment_type === FulfillmentType::Delivery
                ? OrderStatus::OutForDelivery
                : OrderStatus::ReadyForPickup,
            OrderStatus::ReadyForPickup, OrderStatus::OutForDelivery => OrderStatus::Completed,
            default => null,
        };
    }

    /**
     * Whether the order may move from its current status to $to.
     */
    public function canTransition(Order $order, OrderStatus $to): bool
    {
        $allowed = $this->transitionMap()[$order->status->value] ?? [];

        if (! in_array($to, $allowed, true)) {
            return false;
        }

        // The pickup/delivery hand-off edge must match the order's fulfillment type.
        if ($to === OrderStatus::ReadyForPickup) {
            return $order->fulfillment_type === FulfillmentType::Pickup;
        }

        if ($to === OrderStatus::OutForDelivery) {
            return $order->fulfillment_type === FulfillmentType::Delivery;
        }

        return true;
    }

    /**
     * Apply a status transition, stamping lifecycle timestamps and persisting.
     * Illegal transitions abort with a 422.
     */
    public function transition(Order $order, OrderStatus $to, ?string $reason = null): Order
    {
        abort_unless(
            $this->canTransition($order, $to),
            422,
            "Cannot move order from {$order->status->value} to {$to->value}."
        );

        $attributes = ['status' => $to];

        if ($to === OrderStatus::Confirmed) {
            $attributes['confirmed_at'] = now();
        }

        if ($to === OrderStatus::Completed) {
            $attributes['completed_at'] = now();
        }

        if (in_array($to, [OrderStatus::Cancelled, OrderStatus::Rejected], true)) {
            $attributes['cancelled_at'] = now();
            $attributes['cancellation_reason'] = $reason;
        }

        $order->update($attributes);

        return $order;
    }
}
