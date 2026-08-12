<?php

use App\Enums\UserRole;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

test('creates a new consumer account from a fresh google profile', function () {
    Socialite::fake('google', SocialiteUser::fake([
        'id' => 'google-12345',
        'email' => 'newcomer@example.com',
        'name' => 'Juan Dela Cruz',
    ]));

    $response = $this->get(route('auth.callback', 'google'));

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'newcomer@example.com')->firstOrFail();
    expect($user->role)->toBe(UserRole::User)
        ->and($user->provider)->toBe('google')
        ->and($user->provider_id)->toBe('google-12345')
        ->and($user->first_name)->toBe('Juan')
        ->and($user->last_name)->toBe('Dela Cruz')
        ->and($user->email_verified_at)->not->toBeNull();
});

test('links social login to an existing account by matching verified email', function () {
    $user = User::factory()->create(['email' => 'existing@example.com']);

    Socialite::fake('google', SocialiteUser::fake([
        'id' => 'google-99999',
        'email' => 'existing@example.com',
        'name' => 'Existing User',
    ]));

    $response = $this->get(route('auth.callback', 'google'));

    $this->assertAuthenticatedAs($user->fresh());
    $response->assertRedirect(route('dashboard', absolute: false));

    expect(User::count())->toBe(1);
    expect($user->fresh())
        ->provider->toBe('google')
        ->provider_id->toBe('google-99999');
});

test('reuses the linked account on a repeat google login', function () {
    $user = User::factory()->create([
        'email' => 'repeat@example.com',
        'provider' => 'google',
        'provider_id' => 'google-11111',
    ]);

    Socialite::fake('google', SocialiteUser::fake([
        'id' => 'google-11111',
        'email' => 'repeat@example.com',
    ]));

    $this->get(route('auth.callback', 'google'));

    $this->assertAuthenticatedAs($user);
    expect(User::count())->toBe(1);
});

test('a banned user is still logged out on the next request after social login', function () {
    $user = User::factory()->create([
        'email' => 'banned@example.com',
        'banned_at' => now(),
        'ban_reason' => 'Violation',
    ]);

    Socialite::fake('google', SocialiteUser::fake([
        'id' => 'google-22222',
        'email' => 'banned@example.com',
    ]));

    $this->get(route('auth.callback', 'google'));
    $this->assertAuthenticatedAs($user);

    $this->get('/stores')->assertRedirect('/banned');
    $this->assertGuest();
});

test('an unsupported provider is not routable', function () {
    $this->get('/auth/facebook/redirect')->assertNotFound();
    $this->get('/auth/facebook/callback')->assertNotFound();
});

test('a denied google authorization redirects back to login without creating a user', function () {
    $response = $this->get(route('auth.callback', 'google').'?error=access_denied');

    $response->assertRedirect(route('login'));
    $this->assertGuest();
    expect(User::count())->toBe(0);
});
