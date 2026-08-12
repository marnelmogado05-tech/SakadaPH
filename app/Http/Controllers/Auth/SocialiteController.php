<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

class SocialiteController extends Controller
{
    public function redirect(string $provider): RedirectResponse
    {
        return Socialite::driver($provider)->redirect();
    }

    public function callback(string $provider, Request $request): Response
    {
        if ($request->has('error')) {
            return redirect()->route('login');
        }

        try {
            $socialiteUser = Socialite::driver($provider)->user();
        } catch (InvalidStateException) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Your Google sign-in session expired. Please try again.']);
        }

        if (! $socialiteUser->getEmail()) {
            return redirect()->route('login')
                ->withErrors(['email' => 'We could not retrieve an email address from your Google account.']);
        }

        $user = $this->resolveUser($provider, $socialiteUser);

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return app(LoginResponseContract::class)->toResponse($request);
    }

    private function resolveUser(string $provider, SocialiteUserContract $socialiteUser): User
    {
        $user = User::query()
            ->where('provider', $provider)
            ->where('provider_id', $socialiteUser->getId())
            ->first();

        if ($user) {
            return $user;
        }

        $user = User::query()->where('email', $socialiteUser->getEmail())->first();

        if ($user) {
            $user->update([
                'provider' => $provider,
                'provider_id' => $socialiteUser->getId(),
            ]);

            return $user;
        }

        return $this->createUser($provider, $socialiteUser);
    }

    private function createUser(string $provider, SocialiteUserContract $socialiteUser): User
    {
        [$firstName, $lastName] = $this->splitName(
            $socialiteUser->getName() ?: $socialiteUser->getNickname() ?: $socialiteUser->getEmail(),
        );

        return User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $socialiteUser->getEmail(),
            'email_verified_at' => now(),
            'password' => Str::password(40),
            'provider' => $provider,
            'provider_id' => $socialiteUser->getId(),
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $name): array
    {
        $parts = explode(' ', trim($name), 2);

        return [$parts[0], $parts[1] ?? $parts[0]];
    }
}
