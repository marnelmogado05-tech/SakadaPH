<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(20)
            ->through(fn (DatabaseNotification $n) => [
                'id' => $n->id,
                'type' => $n->data['type'] ?? 'general',
                'message' => $n->data['message'] ?? '',
                'store_id' => $n->data['store_id'] ?? null,
                'store_name' => $n->data['store_name'] ?? null,
                'url' => $n->data['url'] ?? null,
                'url_label' => $n->data['url_label'] ?? null,
                'read_at' => $n->read_at?->toDateTimeString(),
                'created_at' => $n->created_at->toDateTimeString(),
            ]);

        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return Inertia::render('notifications', ['notifications' => $notifications]);
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
