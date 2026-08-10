<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case GCash = 'gcash';
    case Card = 'card';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash on handover',
            self::GCash => 'GCash',
            self::Card => 'Credit/Debit card',
        };
    }

    /**
     * Whether this method is settled online (pay-first) rather than on handover.
     */
    public function isOnline(): bool
    {
        return $this !== self::Cash;
    }
}
