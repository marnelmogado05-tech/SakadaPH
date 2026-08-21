<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Inertia\Inertia;

function admin(): User
{
    return User::factory()->admin()->create();
}

it('lists every order across all stores', function () {
    Order::factory()->count(3)->create();

    $this->actingAs(admin())
        ->get(route('admin.orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/index')
            ->has('orders.data', 3)
        );
});

it('filters orders by status', function () {
    Order::factory()->create(['status' => OrderStatus::Pending]);
    Order::factory()->completed()->create();

    $this->actingAs(admin())
        ->get(route('admin.orders.index', ['status' => 'completed']))
        ->assertInertia(fn ($page) => $page->has('orders.data', 1));
});

it('searches orders by store name', function () {
    $store = Store::factory()->approved()->create(['name' => 'FindMe Water Station']);
    Order::factory()->for($store)->create();
    Order::factory()->count(2)->create();

    $this->actingAs(admin())
        ->get(route('admin.orders.index', ['search' => 'FindMe']))
        ->assertInertia(fn ($page) => $page->has('orders.data', 1));
});

it('filters orders by date range', function () {
    Order::factory()->create(['created_at' => now()->subDays(10)]);
    Order::factory()->create(['created_at' => now()]);

    $this->actingAs(admin())
        ->get(route('admin.orders.index', ['date_from' => now()->toDateString()]))
        ->assertInertia(fn ($page) => $page->has('orders.data', 1));
});

it('shows a read-only order detail', function () {
    $order = Order::factory()->create();

    $this->actingAs(admin())
        ->get(route('admin.orders.show', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/show')
            ->where('order.reference', $order->reference)
            ->has('order.customer.email')
        );
});

it('exposes platform order stats on the admin dashboard', function () {
    Order::factory()->count(2)->create(['payment_status' => PaymentStatus::Paid, 'total' => 100]);
    Order::factory()->completed()->create(['total' => 250]);

    // Platform totals scan the whole orders table, so they are deferred and
    // arrive on a follow-up partial request rather than blocking first paint.
    $this->actingAs(admin())
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->missing('orderStats'));

    $this->actingAs(admin())
        ->get(route('admin.dashboard'), [
            'X-Inertia' => 'true',
            'X-Inertia-Partial-Component' => 'admin/dashboard',
            'X-Inertia-Partial-Data' => 'orderStats',
            'X-Inertia-Version' => Inertia::getVersion(),
        ])
        ->assertOk()
        ->assertJsonPath('props.orderStats.total_orders', 3)
        ->assertJsonPath('props.orderStats.completed_orders', 1)
        ->assertJsonStructure(['props' => ['orderStats' => ['gmv', 'cash_orders']]]);
});

it('forbids consumers from admin orders', function () {
    Order::factory()->create();

    $this->actingAs(User::factory()->create())
        ->get(route('admin.orders.index'))
        ->assertForbidden();
});

it('forbids sellers from admin orders', function () {
    $this->actingAs(User::factory()->seller()->create())
        ->get(route('admin.orders.index'))
        ->assertForbidden();
});
