<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\SellerRegistrationRequest;
use App\Models\Store;
use App\Models\User;
use App\Notifications\SellerRegisteredNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class SellerRegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register-seller');
    }

    public function store(SellerRegistrationRequest $request): RedirectResponse
    {
        $user = User::create([
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'extension_name' => $request->extension_name,
            'email' => $request->email,
            'contact_number' => $request->contact_number,
            'role' => UserRole::Seller,
            'password' => Hash::make($request->password),
        ]);

        $store = Store::create([
            'user_id' => $user->id,
            'name' => $request->store_name,
            'description' => $request->store_description,
            'address' => $request->store_address,
            'contact_number' => $request->store_contact_number,
        ]);

        Notification::send(
            User::where('role', UserRole::Admin)->get(),
            new SellerRegisteredNotification($store),
        );

        Auth::login($user);

        return redirect()->route('seller.pending');
    }
}
