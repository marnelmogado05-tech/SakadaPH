<?php

namespace App\Enums;

enum ProductAvailability: string
{
    case InStock = 'in_stock';
    case LowStock = 'low_stock';
    case OutOfStock = 'out_of_stock';

    public function label(): string
    {
        return match ($this) {
            self::InStock => 'In stock',
            self::LowStock => 'Low stock',
            self::OutOfStock => 'Out of stock',
        };
    }

    public function isAvailable(): bool
    {
        return $this !== self::OutOfStock;
    }
}
