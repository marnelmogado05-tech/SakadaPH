<?php

namespace App\Models;

use App\Enums\SellerStatus;
use App\Enums\StoreType;
use App\Mail\SellerApproved;
use App\Mail\SellerRejected;
use Database\Factories\StoreFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $description
 * @property string $address
 * @property string|null $contact_number
 * @property SellerStatus $status
 * @property StoreType|null $type
 * @property float|null $latitude
 * @property float|null $longitude
 * @property float|null $service_radius_km
 * @property array<string, mixed>|null $operating_hours
 * @property string|null $logo_path
 * @property float|null $delivery_fee
 * @property float|null $min_order_amount
 * @property bool $accepts_online_payment
 * @property string|null $gcash_number
 * @property string|null $gcash_qr_path
 * @property string|null $rejection_reason
 * @property Carbon|null $approved_at
 * @property Carbon|null $rejected_at
 * @property int|null $approved_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read int|null $products_count
 * @property-read int|null $in_stock_count
 * @property-read int|null $low_stock_count
 * @property-read int|null $out_of_stock_count
 * @property-read int|null $followers_count
 * @property-read int|null $reviews_count
 * @property-read float|null $reviews_avg_rating
 * @property-read string|null $products_max_last_updated_at
 * @property-read float|null $distance_km
 * @property-read string|null $products_min_price
 * @property-read string|null $products_max_price
 */
class Store extends Model
{
    /** @use HasFactory<StoreFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'address',
        'contact_number',
        'status',
        'type',
        'latitude',
        'longitude',
        'service_radius_km',
        'delivery_fee',
        'min_order_amount',
        'accepts_online_payment',
        'gcash_number',
        'gcash_qr_path',
        'operating_hours',
        'logo_path',
        'rejection_reason',
        'approved_at',
        'rejected_at',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => SellerStatus::class,
            'type' => StoreType::class,
            'latitude' => 'float',
            'longitude' => 'float',
            'service_radius_km' => 'float',
            'delivery_fee' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'accepts_online_payment' => 'boolean',
            'operating_hours' => 'array',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /** @return BelongsToMany<User, $this> */
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'store_follows');
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasMany<Review, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Store-level stock state, derived from its products' availability.
     *
     * Mirrors the four states the `StockLevel` component renders. Requires the
     * `products_count`, `in_stock_count` and `low_stock_count` aggregates to be
     * loaded on the query.
     *
     * @return 'in_stock'|'low_stock'|'out_of_stock'|'no_products'
     */
    public function stockState(): string
    {
        if ($this->products_count === 0) {
            return 'no_products';
        }

        if ($this->in_stock_count > 0) {
            return 'in_stock';
        }

        if ($this->low_stock_count > 0) {
            return 'low_stock';
        }

        return 'out_of_stock';
    }

    public function isPending(): bool
    {
        return $this->status === SellerStatus::Pending;
    }

    public function isApproved(): bool
    {
        return $this->status === SellerStatus::Approved;
    }

    public function isRejected(): bool
    {
        return $this->status === SellerStatus::Rejected;
    }

    public function isSuspended(): bool
    {
        return $this->status === SellerStatus::Suspended;
    }

    public function approve(User $admin): void
    {
        $this->update([
            'status' => SellerStatus::Approved,
            'approved_at' => now(),
            'approved_by' => $admin->id,
            'rejection_reason' => null,
            'rejected_at' => null,
        ]);

        Mail::to($this->user)->send(new SellerApproved($this));
    }

    public function reject(User $admin, string $reason): void
    {
        $this->update([
            'status' => SellerStatus::Rejected,
            'rejected_at' => now(),
            'approved_by' => $admin->id,
            'rejection_reason' => $reason,
        ]);

        Mail::to($this->user)->send(new SellerRejected($this));
    }

    public function suspend(User $admin, string $reason): void
    {
        $this->update([
            'status' => SellerStatus::Suspended,
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Lift a suspension.
     *
     * Deliberately not {@see approve()}, which emails the seller that they have
     * been approved — the wrong thing to tell someone who was approved long ago
     * and is simply being let back in. It also leaves `approved_at` alone:
     * reinstating is not re-approving. Silent, like {@see suspend()}.
     */
    public function reinstate(User $admin): void
    {
        $this->update([
            'status' => SellerStatus::Approved,
            'approved_by' => $admin->id,
            'rejection_reason' => null,
        ]);
    }
}
