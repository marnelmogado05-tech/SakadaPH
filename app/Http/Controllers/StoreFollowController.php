<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreFollowController extends Controller
{
    public function follow(Request $request, Store $store): RedirectResponse
    {
        abort_unless($store->isApproved(), 404);
        abort_unless($request->user()->role === UserRole::User, 403);

        $request->user()->followedStores()->syncWithoutDetaching([$store->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "You are now following {$store->name}."]);

        return back();
    }

    public function unfollow(Request $request, Store $store): RedirectResponse
    {
        $request->user()->followedStores()->detach($store->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Unfollowed {$store->name}."]);

        return back();
    }
}
