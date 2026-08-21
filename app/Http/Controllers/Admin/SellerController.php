<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SellerStatus;
use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use App\Notifications\SellerApprovedNotification;
use App\Notifications\SellerRejectedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class SellerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString() ?: null;
        $statusFilter = $request->string('status')->toString() ?: null;
        $staleThreshold = Carbon::now()->subDays(7);

        $stores = Store::with('user')
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            }))
            ->when($statusFilter && $statusFilter !== 'all', fn ($q) => $q->where('status', $statusFilter))
            ->withMax('products', 'last_updated_at')
            ->withCount('products')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString()
            ->through(function (Store $store) use ($staleThreshold) {
                assert($store->user instanceof User);

                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'address' => $store->address,
                    'description' => $store->description,
                    'contact_number' => $store->contact_number,
                    'status' => $store->status->value,
                    'rejection_reason' => $store->rejection_reason,
                    'created_at' => $store->created_at?->toDateTimeString(),
                    'is_stale' => $store->status === SellerStatus::Approved && (
                        $store->products_count === 0
                        || ($store->products_max_last_updated_at !== null && Carbon::parse($store->products_max_last_updated_at)->lt($staleThreshold))
                    ),
                    'seller' => [
                        'id' => $store->user->id,
                        'first_name' => $store->user->first_name,
                        'last_name' => $store->user->last_name,
                        'email' => $store->user->email,
                        'contact_number' => $store->user->contact_number,
                    ],
                ];
            });

        return Inertia::render('admin/sellers/index', [
            'stores' => $stores,
            'filters' => [
                'search' => $search ?? '',
                'status' => $statusFilter ?? '',
            ],
        ]);
    }

    public function approve(Request $request, Store $store): RedirectResponse
    {
        if (! $store->isPending()) {
            return back();
        }

        /** @var User $user */
        $user = $request->user();
        $store->approve($user);
        $store->user?->notify(new SellerApprovedNotification($store));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Store \"{$store->name}\" approved."]);

        return back();
    }

    public function reject(Request $request, Store $store): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        if (! $store->isPending()) {
            return back();
        }

        /** @var User $user */
        $user = $request->user();
        $store->reject($user, $validated['reason']);
        $store->user?->notify(new SellerRejectedNotification($store));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Store \"{$store->name}\" rejected."]);

        return back();
    }

    public function suspend(Request $request, Store $store): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        if (! $store->isApproved()) {
            return back();
        }

        /** @var User $user */
        $user = $request->user();
        $store->suspend($user, $validated['reason']);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Store \"{$store->name}\" suspended."]);

        return back();
    }

    public function unsuspend(Request $request, Store $store): RedirectResponse
    {
        if (! $store->isSuspended()) {
            return back();
        }

        /** @var User $user */
        $user = $request->user();
        $store->reinstate($user);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Store \"{$store->name}\" reinstated."]);

        return back();
    }
}
