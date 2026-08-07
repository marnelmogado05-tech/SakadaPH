<?php

namespace App\Models;

use App\Enums\ProductAvailability;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $store_id
 * @property string $name
 * @property string|null $description
 * @property float $price
 * @property string $unit
 * @property int $quantity
 * @property ProductAvailability $availability
 * @property Carbon|null $last_updated_at
 * @property string|null $image_path
 */
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'store_id',
        'name',
        'description',
        'price',
        'unit',
        'quantity',
        'availability',
        'last_updated_at',
        'image_path',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'availability' => ProductAvailability::class,
            'last_updated_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function setAvailability(ProductAvailability $availability): void
    {
        $this->update([
            'availability' => $availability,
            'last_updated_at' => now(),
        ]);
    }
}
