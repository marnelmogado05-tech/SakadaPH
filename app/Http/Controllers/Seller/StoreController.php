<?php

namespace App\Http\Controllers\Seller;

use App\Enums\StoreType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreUpdateRequest;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        $store->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Store details updated.']);

        return to_route('seller.store.edit');
    }
}
