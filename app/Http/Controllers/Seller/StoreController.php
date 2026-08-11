<?php

namespace App\Http\Controllers\Seller;

use App\Enums\StoreType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreUpdateRequest;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;

        return Inertia::render('seller/store', [
            'store' => [
                'name' => $store->name,
                'description' => $store->description,
                'address' => $store->address,
                'contact_number' => $store->contact_number,
                'type' => ($store->type ?? StoreType::Pickup)->value,
                'latitude' => $store->latitude,
                'longitude' => $store->longitude,
                'service_radius_km' => $store->service_radius_km,
                'delivery_fee' => $store->delivery_fee !== null ? (float) $store->delivery_fee : null,
                'min_order_amount' => $store->min_order_amount !== null ? (float) $store->min_order_amount : null,
                'accepts_online_payment' => $store->accepts_online_payment,
                'gcash_number' => $store->gcash_number,
                'gcash_qr_url' => $store->gcash_qr_path
                    ? Storage::disk('public')->url($store->gcash_qr_path)
                    : null,
            ],
            'storeTypes' => collect(StoreType::cases())->map(fn (StoreType $type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    public function update(StoreUpdateRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Store $store */
        $store = $user->store;

        $validated = $request->safe()->except('gcash_qr');

        if ($request->hasFile('gcash_qr')) {
            if ($store->gcash_qr_path) {
                Storage::disk('public')->delete($store->gcash_qr_path);
            }

            $validated['gcash_qr_path'] = $request->file('gcash_qr')->store('gcash-qr', 'public');
        }

        $store->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Store details updated.']);

        return to_route('seller.store.edit');
    }
}
