<?php

namespace App\Enums;

enum FulfillmentType: string
{
    case Pickup = 'pickup';
    case Delivery = 'delivery';

    public function label(): string
    {
        return match ($this) {
            self::Pickup => 'Pickup',
            self::Delivery => 'Delivery',
        };
    }

    /**
     * Whether this fulfillment type is allowed by a store of the given type.
     */
    public function isAllowedBy(StoreType $storeType): bool
    {
        return match ($storeType) {
            StoreType::Pickup => $this === self::Pickup,
            StoreType::Delivery => $this === self::Delivery,
            StoreType::Both => true,
        };
    }
}
