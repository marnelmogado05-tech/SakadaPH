<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

it('shows the users list to an admin', function () {
    User::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->where('users.total', 3)
        );
});

it('excludes admins from the user list', function () {
    User::factory()->admin()->count(2)->create();
    User::factory()->count(1)->create();

    $this->actingAs($this->admin)
        ->get('/admin/users')
        ->assertInertia(fn ($page) => $page
            ->where('users.total', 1)
        );
});

it('can ban a user', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin)
        ->post("/admin/users/{$user->id}/ban", ['reason' => 'Spam activity'])
        ->assertRedirect();

    expect($user->fresh()->isBanned())->toBeTrue();
    expect($user->fresh()->ban_reason)->toBe('Spam activity');
});

it('cannot ban an admin', function () {
    $otherAdmin = User::factory()->admin()->create();

    $this->actingAs($this->admin)
        ->post("/admin/users/{$otherAdmin->id}/ban", ['reason' => 'Test'])
        ->assertRedirect();

    expect($otherAdmin->fresh()->isBanned())->toBeFalse();
});

it('can unban a user', function () {
    $user = User::factory()->create([
        'banned_at' => now(),
        'ban_reason' => 'Old reason',
    ]);

    $this->actingAs($this->admin)
        ->post("/admin/users/{$user->id}/unban")
        ->assertRedirect();

    expect($user->fresh()->isBanned())->toBeFalse();
    expect($user->fresh()->ban_reason)->toBeNull();
});

it('filters banned users', function () {
    User::factory()->create();
    User::factory()->create(['banned_at' => now(), 'ban_reason' => 'Test']);

    $this->actingAs($this->admin)
        ->get('/admin/users?status=banned')
        ->assertInertia(fn ($page) => $page
            ->where('users.total', 1)
        );
});

it('searches users by name or email', function () {
    User::factory()->create(['first_name' => 'Alice', 'email' => 'alice@example.com']);
    User::factory()->create(['first_name' => 'Bob', 'email' => 'bob@example.com']);

    $this->actingAs($this->admin)
        ->get('/admin/users?search=alice')
        ->assertInertia(fn ($page) => $page
            ->where('users.total', 1)
            ->where('users.data.0.first_name', 'Alice')
        );
});

it('logs out a banned user on their next request', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/stores')->assertOk();

    $user->update(['banned_at' => now(), 'ban_reason' => 'Violation']);

    $this->actingAs($user)->get('/stores')->assertRedirect('/banned');
});

it('does not log out admins even if banned_at is somehow set', function () {
    $admin = User::factory()->admin()->create(['banned_at' => now()]);

    $this->actingAs($admin)->get('/admin/dashboard')->assertOk();
});
