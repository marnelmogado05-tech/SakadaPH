<?php

namespace Database\Seeders;

use App\Enums\ProductAvailability;
use App\Enums\SellerStatus;
use App\Enums\StoreType;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Populates SakadaPH with realistic-looking demo data for a portfolio showcase.
 *
 * Run standalone, on top of the base DatabaseSeeder:
 *   php artisan storage:link          (once, if you haven't already)
 *   php artisan db:seed --class=Database\\Seeders\\DemoSeeder
 *
 * All data here is fictional. The frontend should display a persistent
 * "Demo Environment — sample data" banner alongside it so visitors never
 * mistake this for a live marketplace.
 *
 * Images: downloaded at seed time from LoremFlickr (a free placeholder
 * service that serves real, themed stock photos) and saved to the `public`
 * disk, matching how ProductController/StoreController already resolve
 * image_url/logo_path. Requires internet access on whatever machine runs
 * the seed. Swap seedPlaceholderImage()'s source for your own asset pack
 * before a real production launch — these are unlicensed placeholders,
 * fine for a portfolio demo but not for a live marketplace.
 */
class DemoSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Realistic Metro Manila locations (city/barangay => [lat, lng]).
     * Real coordinates so the Leaflet map reads as a genuine, spread-out
     * service area instead of a cluster of randomly-jittered pins.
     *
     * @var array<string, array{0: float, 1: float}>
     */
    private array $locations = [
        'Barangay Poblacion, Manila' => [14.5995, 120.9842],
        'Barangay Commonwealth, Quezon City' => [14.6969, 121.0797],
        'Barangay Poblacion, Makati' => [14.5547, 121.0244],
        'Barangay Kapitolyo, Pasig' => [14.5692, 121.0625],
        'Barangay Addition Hills, Mandaluyong' => [14.5794, 121.0359],
        'Barangay 176, Caloocan' => [14.7566, 120.9846],
        'Barangay Western Bicutan, Taguig' => [14.5176, 121.0509],
        'Barangay San Roque, Pasay' => [14.5378, 120.9986],
        'Barangay Greenhills, San Juan' => [14.6019, 121.0355],
        'Barangay Concepcion Uno, Marikina' => [14.6355, 121.0938],
        'Barangay San Antonio, Parañaque' => [14.4793, 121.0198],
        'Barangay Talon Uno, Las Piñas' => [14.4499, 120.9835],
    ];

    /**
     * Realistic Filipino water-refilling-station business names.
     *
     * @var array<int, string>
     */
    private array $storeNames = [
        'Crystal Clear Water Station',
        'Tubig Malinis Refilling',
        'AquaPure Water Refilling Station',
        'Sagana Water Station',
        'Handog Tubig Purified Water',
        'Malinis na Tubig Water Refilling',
        'Blue Wave Water Station',
        'Kristal Tubig Refilling Station',
        'Fresh Spring Water Refilling',
        'Bukal ng Buhay Water Station',
        'AquaBest Purified Water',
        'Ever Fresh Water Refilling Station',
    ];

    public function run(): void
    {
        // Note: image downloads happen inside seedStoresWithProducts() /
        // seedProductsFor(), which run inside this transaction. That's fine
        // for a one-off demo seed (a failed download just leaves image_path
        // null, per seedPlaceholderImage()'s try/catch), but if you ever
        // seed a large dataset, pull the download loop out of the
        // transaction first so a slow network doesn't hold a DB lock open.
        DB::transaction(function () {
            $consumers = $this->seedConsumers();
            $stores = $this->seedStoresWithProducts();
            $this->seedFollows($consumers, $stores);
            $this->seedOrdersAndReviews($consumers, $stores);
        });
    }

    /**
     * Downloads a themed placeholder photo and stores it on the `public`
     * disk, returning the relative path to save on the model
     * (image_path / logo_path). `lock` makes LoremFlickr deterministic, so
     * re-running the seeder against a fresh DB produces the same images.
     */
    private function seedPlaceholderImage(string $directory, string $tag, int $lock, string $width = '640', string $height = '480'): ?string
    {
        $path = "{$directory}/".Str::uuid().'.jpg';

        try {
            $response = Http::timeout(10)->get("https://loremflickr.com/{$width}/{$height}/{$tag}", [
                'lock' => $lock,
            ]);

            if (! $response->successful()) {
                return null;
            }

            Storage::disk('public')->put($path, $response->body());

            return $path;
        } catch (\Throwable $e) {
            // Seeding shouldn't hard-fail a demo just because an image
            // download timed out — log it and leave image_path null instead.
            Log::warning("DemoSeeder: image download failed for {$tag}", ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * @return array<int, User>
     */
    private function seedConsumers(): array
    {
        $names = [
            ['Juan', 'Dela Cruz'], ['Maria', 'Santos'], ['Jose', 'Reyes'],
            ['Ana', 'Bautista'], ['Pedro', 'Garcia'], ['Rosa', 'Mendoza'],
            ['Carlos', 'Torres'], ['Liza', 'Ramos'], ['Mark', 'Fernandez'],
            ['Grace', 'Aquino'],
        ];

        return collect($names)->map(fn (array $name, int $i) => User::factory()->create([
            'first_name' => $name[0],
            'last_name' => $name[1],
            'email' => 'demo.consumer'.($i + 1).'@sakada.ph',
            'role' => UserRole::User,
        ]))->all();
    }

    /**
     * @return array<int, Store>
     */
    private function seedStoresWithProducts(): array
    {
        $locations = array_values($this->locations);
        $stores = [];

        foreach ($this->storeNames as $i => $name) {
            [$barangay, [$lat, $lng]] = [array_keys($this->locations)[$i], $locations[$i]];

            // Nearly all approved so the showcase looks alive; a couple of
            // edge-case statuses so the admin dashboard has something to show.
            $status = match (true) {
                $i === count($this->storeNames) - 1 => SellerStatus::Pending,
                $i === count($this->storeNames) - 2 => SellerStatus::Suspended,
                default => SellerStatus::Approved,
            };

            $seller = User::factory()->seller()->create([
                'first_name' => explode(' ', $name)[0],
                'last_name' => 'Owner',
                'email' => 'demo.seller'.($i + 1).'@sakada.ph',
            ]);

            // Slight jitter (~within a couple hundred meters) so stores in the
            // same barangay don't render as a single overlapping pin.
            $jitter = fn (float $coord) => $coord + fake()->randomFloat(4, -0.003, 0.003);

            $logoPath = $this->seedPlaceholderImage('stores/logos', 'water,logo,drink', $i, '300', '300');

            $store = Store::factory()
                ->for($seller)
                ->create([
                    'name' => $name,
                    'logo_path' => $logoPath,
                    'description' => fake()->randomElement([
                        'Affordable purified and mineral water, refill or buy in bulk.',
                        'Trusted neighborhood water station serving the community since 2018.',
                        'Fast delivery, clean containers, reliable stock.',
                        'Family-owned water refilling station with same-day delivery.',
                    ]),
                    'address' => $barangay.', Metro Manila',
                    'status' => $status,
                    'type' => fake()->randomElement(StoreType::cases()),
                    'latitude' => $jitter($lat),
                    'longitude' => $jitter($lng),
                    'service_radius_km' => fake()->randomElement([3, 5, 8, 10]),
                    'delivery_fee' => fake()->randomElement([0, 20, 25, 30, 50]),
                    'accepts_online_payment' => fake()->boolean(70),
                    'gcash_number' => '09'.fake()->numerify('#########'),
                    'approved_at' => $status === SellerStatus::Approved ? now() : null,
                ]);

            $this->seedProductsFor($store, $i);
            $stores[] = $store;
        }

        return $stores;
    }

    private function seedProductsFor(Store $store, int $index): void
    {
        $catalog = [
            ['name' => '5-Gallon Purified Water Refill', 'unit' => 'container', 'price' => [25, 35]],
            ['name' => '3-Gallon Purified Water Refill', 'unit' => 'container', 'price' => [18, 25]],
            ['name' => '500ml Mineral Water (Case of 24)', 'unit' => 'case', 'price' => [150, 210]],
            ['name' => 'Alkaline Water Refill', 'unit' => 'container', 'price' => [40, 60]],
            ['name' => '1-Liter Distilled Water (6-pack)', 'unit' => 'pack', 'price' => [90, 130]],
        ];

        // Distribute availability so the map's color-coded markers and each
        // store's stock badges show real variety, not all-green.
        $availabilityCycle = [
            ProductAvailability::InStock,
            ProductAvailability::InStock,
            ProductAvailability::LowStock,
            ProductAvailability::OutOfStock,
        ];

        foreach (array_slice($catalog, 0, fake()->numberBetween(2, 4)) as $j => $item) {
            $availability = $availabilityCycle[($index + $j) % count($availabilityCycle)];

            // Unique lock per product (across all stores) so photos vary
            // instead of every "5-Gallon Refill" getting the same image.
            $imagePath = $this->seedPlaceholderImage(
                'products',
                str_contains($item['name'], 'Gallon') || str_contains($item['name'], 'Refill')
                    ? 'water,jug,gallon'
                    : 'water,bottle,drink',
                ($index * 10) + $j
            );

            Product::factory()->for($store)->create([
                'name' => $item['name'],
                'unit' => $item['unit'],
                'price' => fake()->randomFloat(2, $item['price'][0], $item['price'][1]),
                'quantity' => $availability === ProductAvailability::OutOfStock
                    ? 0
                    : fake()->numberBetween(5, 150),
                'availability' => $availability,
                'last_updated_at' => now()->subDays(fake()->numberBetween(0, 6)),
                'image_path' => $imagePath,
            ]);
        }
    }

    /**
     * @param  array<int, User>  $consumers
     * @param  array<int, Store>  $stores
     */
    private function seedFollows(array $consumers, array $stores): void
    {
        $approvedStores = collect($stores)->filter(fn (Store $s) => $s->isApproved());

        foreach ($consumers as $consumer) {
            $consumer->followedStores()->attach(
                $approvedStores->random(fake()->numberBetween(2, 5))->pluck('id')->all()
            );
        }
    }

    /**
     * @param  array<int, User>  $consumers
     * @param  array<int, Store>  $stores
     */
    private function seedOrdersAndReviews(array $consumers, array $stores): void
    {
        $comments = [
            'Mabilis ang delivery, malinis ang tubig!',
            'Great service, always in stock.',
            'Affordable and the staff are friendly.',
            'Consistent quality every refill.',
            'Sana mas mabilis pag peak hours, pero okay naman overall.',
            null,
            null,
        ];

        foreach (collect($stores)->filter(fn (Store $s) => $s->isApproved()) as $store) {
            $product = $store->products()->first();

            foreach (range(1, fake()->numberBetween(2, 5)) as $_) {
                $consumer = fake()->randomElement($consumers);

                $order = Order::factory()
                    ->completed()
                    ->for($store, 'store')
                    ->for($consumer, 'user')
                    ->create();

                if ($product) {
                    OrderItem::factory()->create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'name' => $product->name,
                        'unit' => $product->unit,
                        'unit_price' => $product->price,
                        'quantity' => $qty = fake()->numberBetween(1, 5),
                        'line_total' => round($product->price * $qty, 2),
                    ]);
                }

                Review::factory()->create([
                    'order_id' => $order->id,
                    'user_id' => $consumer->id,
                    'store_id' => $store->id,
                    'rating' => fake()->randomElement([3, 4, 4, 5, 5, 5]),
                    'comment' => fake()->randomElement($comments),
                ]);
            }
        }
    }
}
