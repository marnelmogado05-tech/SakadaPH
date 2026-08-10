<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Unpaid = 'unpaid';
    case Pending = 'pending';
    case Paid = 'paid';
    case Failed = 'failed';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Unpaid => 'Unpaid',
            self::Pending => 'Awaiting payment',
            self::Paid => 'Paid',
            self::Failed => 'Payment failed',
            self::Refunded => 'Refunded',
        };
    }
}
