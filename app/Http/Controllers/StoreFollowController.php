<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreFollowController extends Controller
{
    public function follow(Request $request, Store $store): RedirectResponse
    {
        abort_unless($store->isApproved(), 404);
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->role === UserRole::User, 403);

        $user->followedStores()->syncWithoutDetaching([$store->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "You are now following {$store->name}."]);

        return back();
    }

    public function unfollow(Request $request, Store $store): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->followedStores()->detach($store->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Unfollowed {$store->name}."]);

        return back();
    }
}
