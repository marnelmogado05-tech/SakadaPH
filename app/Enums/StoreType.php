<?php

namespace App\Enums;

enum StoreType: string
{
    case Pickup = 'pickup';
    case Delivery = 'delivery';
    case Both = 'both';

    public function label(): string
    {
        return match ($this) {
            self::Pickup => 'Pickup only',
            self::Delivery => 'Delivery only',
            self::Both => 'Pickup & Delivery',
        };
    }
}
