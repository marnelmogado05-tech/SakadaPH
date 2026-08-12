<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\SellerController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\Consumer\CartController;
use App\Http\Controllers\Consumer\CheckoutController;
use App\Http\Controllers\Consumer\DashboardController;
use App\Http\Controllers\Consumer\FollowingController;
use App\Http\Controllers\Consumer\OrderController;
use App\Http\Controllers\Consumer\ReviewController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Public\StoreController as PublicStoreController;
use App\Http\Controllers\Seller\DashboardController as SellerDashboardController;
use App\Http\Controllers\Seller\OrderController as SellerOrderController;
use App\Http\Controllers\Seller\ProductController;
use App\Http\Controllers\Seller\StoreController;
use App\Http\Controllers\SellerRegistrationController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\StoreFollowController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('banned', 'banned')->name('banned');
Route::get('sitemap.xml', SitemapController::class)->name('sitemap');

Route::prefix('stores')->name('stores.')->group(function () {
    Route::get('/', [PublicStoreController::class, 'index'])->name('index');
    Route::get('/{store}', [PublicStoreController::class, 'show'])->name('show');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware('role:user')->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
    });
    Route::post('stores/{store}/follow', [StoreFollowController::class, 'follow'])->name('stores.follow');
    Route::post('stores/{store}/unfollow', [StoreFollowController::class, 'unfollow'])->name('stores.unfollow');
    Route::get('following', [FollowingController::class, 'index'])->name('following');
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    Route::get('cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('cart', [CartController::class, 'store'])->name('cart.store');
    Route::patch('cart/items/{cartItem}', [CartController::class, 'update'])->name('cart.items.update');
    Route::delete('cart/items/{cartItem}', [CartController::class, 'destroy'])->name('cart.items.destroy');
    Route::delete('cart', [CartController::class, 'clear'])->name('cart.clear');

    Route::get('checkout', [CheckoutController::class, 'show'])->name('checkout.show');

    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    Route::post('orders/{order}/gcash-reference', [OrderController::class, 'submitGcashReference'])->name('orders.gcash-reference');
    Route::post('orders/{order}/review', [ReviewController::class, 'store'])->name('orders.review');
});

Route::middleware('guest')->group(function () {
    Route::get('register/seller', [SellerRegistrationController::class, 'create'])->name('seller.register');
    Route::post('register/seller', [SellerRegistrationController::class, 'store'])->name('seller.register.store');

    Route::middleware('throttle:social-login')->group(function () {
        Route::get('auth/{provider}/redirect', [SocialiteController::class, 'redirect'])
            ->where('provider', 'google')
            ->name('auth.redirect');
        Route::get('auth/{provider}/callback', [SocialiteController::class, 'callback'])
            ->where('provider', 'google')
            ->name('auth.callback');
    });
});

Route::middleware(['auth', 'verified', 'role:seller'])->prefix('seller')->name('seller.')->group(function () {
    Route::inertia('pending', 'seller/pending')->name('pending');
    Route::inertia('suspended', 'seller/suspended')->name('suspended');

    Route::middleware('seller.approved')->group(function () {
        Route::get('dashboard', SellerDashboardController::class)->name('dashboard');
        Route::get('store', [StoreController::class, 'edit'])->name('store.edit');
        Route::patch('store', [StoreController::class, 'update'])->name('store.update');
        Route::resource('products', ProductController::class)->except(['show']);
        Route::patch('products/{product}/availability', [ProductController::class, 'updateAvailability'])->name('products.availability');

        Route::get('orders', [SellerOrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{order}', [SellerOrderController::class, 'show'])->name('orders.show');
        Route::post('orders/{order}/confirm', [SellerOrderController::class, 'confirm'])->name('orders.confirm');
        Route::post('orders/{order}/reject', [SellerOrderController::class, 'reject'])->name('orders.reject');
        Route::post('orders/{order}/advance', [SellerOrderController::class, 'advance'])->name('orders.advance');
        Route::post('orders/{order}/mark-paid', [SellerOrderController::class, 'markPaid'])->name('orders.mark-paid');
    });
});

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('sellers', [SellerController::class, 'index'])->name('sellers.index');
    Route::post('sellers/{store}/approve', [SellerController::class, 'approve'])->name('sellers.approve');
    Route::post('sellers/{store}/reject', [SellerController::class, 'reject'])->name('sellers.reject');
    Route::post('sellers/{store}/suspend', [SellerController::class, 'suspend'])->name('sellers.suspend');
    Route::post('sellers/{store}/unsuspend', [SellerController::class, 'unsuspend'])->name('sellers.unsuspend');
    Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('users/{user}/ban', [AdminUserController::class, 'ban'])->name('users.ban');
    Route::post('users/{user}/unban', [AdminUserController::class, 'unban'])->name('users.unban');
    Route::get('orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
});

require __DIR__.'/settings.php';
