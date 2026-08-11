<?php

namespace App\Models;

use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $order_id
 * @property string $provider
 * @property string|null $provider_reference
 * @property float $amount
 * @property string $status
 * @property array<string, mixed>|null $raw_payload
 */
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'order_id',
        'provider',
        'provider_reference',
        'amount',
        'status',
        'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'raw_payload' => 'array',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
