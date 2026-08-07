<?php

namespace App\Http\Responses;

use App\Enums\UserRole;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $user = $request->user();

        $home = match ($user->role) {
            UserRole::Admin => route('admin.dashboard'),
            UserRole::Seller => match (true) {
                $user->store?->isApproved() => route('seller.dashboard'),
                $user->store?->isSuspended() => route('seller.suspended'),
                default => route('seller.pending'),
            },
            default => route('dashboard'),
        };

        return redirect()->intended($home);
    }
}
