<?php

namespace App\Http\Controllers\Consumer;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Consumer\ReviewRequest;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ReviewController extends Controller
{
    /**
     * Create or update the consumer's review for a completed order.
     */
    public function store(ReviewRequest $request, Order $order): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($order->user_id === $user->id, 403);

        if ($order->status !== OrderStatus::Completed) {
            throw ValidationException::withMessages([
                'rating' => 'You can only review completed orders.',
            ]);
        }

        $validated = $request->validated();
        $wasExisting = $order->review()->exists();

        $order->review()->updateOrCreate(
            ['order_id' => $order->id],
            [
                'user_id' => $user->id,
                'store_id' => $order->store_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => $wasExisting ? 'Review updated.' : 'Review submitted.']);

        return back();
    }
}
