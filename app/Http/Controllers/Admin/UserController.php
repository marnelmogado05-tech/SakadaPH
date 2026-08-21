<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString() ?: null;
        $statusFilter = $request->string('status')->toString() ?: null;

        $users = User::where('role', '!=', UserRole::Admin)
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->when($statusFilter === 'banned', fn ($q) => $q->whereNotNull('banned_at'))
            ->when($statusFilter === 'active', fn ($q) => $q->whereNull('banned_at'))
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role->value,
                'contact_number' => $user->contact_number,
                'banned_at' => $user->banned_at?->toDateTimeString(),
                'ban_reason' => $user->ban_reason,
                'created_at' => $user->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search ?? '',
                'status' => $statusFilter ?? '',
            ],
        ]);
    }

    public function ban(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        if ($user->role === UserRole::Admin) {
            return back();
        }

        $user->update([
            'banned_at' => Carbon::now(),
            'ban_reason' => $validated['reason'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Banned {$user->first_name} {$user->last_name}."]);

        return back();
    }

    public function unban(User $user): RedirectResponse
    {
        $user->update([
            'banned_at' => null,
            'ban_reason' => null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Unbanned {$user->first_name} {$user->last_name}."]);

        return back();
    }
}
