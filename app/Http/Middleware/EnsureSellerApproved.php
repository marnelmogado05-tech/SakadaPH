<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSellerApproved
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $store = $request->user()?->store;

        if ($store?->isSuspended()) {
            return redirect()->route('seller.suspended');
        }

        if (! $store?->isApproved()) {
            return redirect()->route('seller.pending');
        }

        return $next($request);
    }
}
