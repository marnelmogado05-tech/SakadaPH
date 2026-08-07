<?php

namespace App\Models;

use App\Enums\SellerStatus;
use App\Enums\StoreType;
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
 * @property StoreType $type
 * @property float|null $latitude
 * @property float|null $longitude
 * @property float|null $service_radius_km
 * @property array|null $operating_hours
 * @property string|null $logo_path
 * @property string|null $rejection_reason
 * @property Carbon|null $approved_at
 * @property Carbon|null $rejected_at
 * @property int|null $approved_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
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
            'operating_hours' => 'array',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'store_follows');
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

        Mail::to($this->user)->send(new \App\Mail\SellerApproved($this));
    }

    public function reject(User $admin, string $reason): void
    {
        $this->update([
            'status' => SellerStatus::Rejected,
            'rejected_at' => now(),
            'approved_by' => $admin->id,
            'rejection_reason' => $reason,
        ]);

        Mail::to($this->user)->send(new \App\Mail\SellerRejected($this));
    }

    public function suspend(User $admin, string $reason): void
    {
        $this->update([
            'status' => SellerStatus::Suspended,
            'rejection_reason' => $reason,
        ]);
    }
}
