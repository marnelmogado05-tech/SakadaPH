import { Head, Link, useForm } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft } from 'lucide-react';
import {
    Circle,
    MapContainer,
    Marker,
    TileLayer,
    useMapEvents,
} from 'react-leaflet';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { index as cartIndex } from '@/routes/cart';
import { store as ordersStore } from '@/routes/orders';

type FulfillmentOption = { value: string; label: string };

type CheckoutStore = {
    id: number;
    name: string;
    type: string | null;
    latitude: number | null;
    longitude: number | null;
    service_radius_km: number | null;
    delivery_fee: number;
    min_order_amount: number | null;
};

type CheckoutItem = {
    id: number;
    name: string;
    unit: string;
    price: number;
    quantity: number;
    line_total: number;
};

type PaymentOption = { value: string; label: string };

type Props = {
    store: CheckoutStore;
    fulfillmentOptions: FulfillmentOption[];
    items: CheckoutItem[];
    subtotal: number;
    contactNumber: string | null;
    paymentMethods: PaymentOption[];
};

const PH_CENTER: [number, number] = [12.8797, 121.774];

const PIN_ICON = L.divIcon({
    className: '',
    html: '<div style="width:16px;height:16px;background:#dc2626;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

function formatPrice(value: number): string {
    return '₱' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function PickLocation({
    onPick,
}: {
    onPick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click: (e) => onPick(e.latlng.lat, e.latlng.lng),
    });

    return null;
}

export default function CheckoutIndex({
    store,
    fulfillmentOptions,
    items,
    subtotal,
    contactNumber,
    paymentMethods,
}: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        fulfillment_type: string;
        payment_method: string;
        contact_number: string;
        delivery_address: string;
        delivery_latitude: number | null;
        delivery_longitude: number | null;
        notes: string;
    }>({
        fulfillment_type: fulfillmentOptions[0]?.value ?? 'pickup',
        payment_method: 'cash',
        contact_number: contactNumber ?? '',
        delivery_address: '',
        delivery_latitude: null,
        delivery_longitude: null,
        notes: '',
    });

    const isDelivery = data.fulfillment_type === 'delivery';
    const deliveryFee = isDelivery ? store.delivery_fee : 0;
    const total = subtotal + deliveryFee;

    const mapCenter: [number, number] =
        store.latitude != null && store.longitude != null
            ? [store.latitude, store.longitude]
            : PH_CENTER;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(ordersStore().url);
    }

    return (
        <>
            <Head title="Checkout" />

            <div className="mx-auto max-w-2xl px-4 py-6">
                <Link
                    href={cartIndex()}
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    Back to cart
                </Link>

                <h1 className="mb-6 text-lg font-semibold tracking-tight text-foreground">
                    Checkout
                </h1>

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-xl border border-border/60 bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">
                            Fulfillment
                        </h2>
                        <div className="grid gap-2">
                            {fulfillmentOptions.map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                                        data.fulfillment_type === opt.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="fulfillment_type"
                                        value={opt.value}
                                        checked={
                                            data.fulfillment_type === opt.value
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'fulfillment_type',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        <InputError
                            className="mt-2"
                            message={errors.fulfillment_type}
                        />
                    </section>

                    {isDelivery && (
                        <section className="rounded-xl border border-border/60 bg-card p-4">
                            <h2 className="mb-3 text-sm font-semibold text-foreground">
                                Delivery location
                            </h2>

                            <div className="grid gap-2">
                                <Label htmlFor="delivery_address">Address</Label>
                                <Textarea
                                    id="delivery_address"
                                    value={data.delivery_address}
                                    onChange={(e) =>
                                        setData(
                                            'delivery_address',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="House/unit no., street, barangay, landmark…"
                                    className="min-h-20"
                                />
                                <InputError message={errors.delivery_address} />
                            </div>

                            <p className="mt-4 mb-2 text-xs text-muted-foreground">
                                Tap the map to drop a pin at your delivery spot.
                            </p>
                            <div className="h-64 overflow-hidden rounded-lg border border-border">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={store.latitude != null ? 13 : 6}
                                    scrollWheelZoom
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <PickLocation
                                        onPick={(lat, lng) => {
                                            setData((prev) => ({
                                                ...prev,
                                                delivery_latitude: lat,
                                                delivery_longitude: lng,
                                            }));
                                        }}
                                    />
                                    {store.latitude != null &&
                                        store.longitude != null &&
                                        store.service_radius_km != null && (
                                            <Circle
                                                center={[
                                                    store.latitude,
                                                    store.longitude,
                                                ]}
                                                radius={
                                                    store.service_radius_km *
                                                    1000
                                                }
                                                pathOptions={{
                                                    color: '#2563eb',
                                                    fillColor: '#2563eb',
                                                    fillOpacity: 0.06,
                                                    weight: 1.5,
                                                    dashArray: '4 4',
                                                }}
                                            />
                                        )}
                                    {data.delivery_latitude != null &&
                                        data.delivery_longitude != null && (
                                            <Marker
                                                position={[
                                                    data.delivery_latitude,
                                                    data.delivery_longitude,
                                                ]}
                                                icon={PIN_ICON}
                                            />
                                        )}
                                </MapContainer>
                            </div>
                            <InputError
                                className="mt-2"
                                message={errors.delivery_latitude}
                            />
                        </section>
                    )}

                    <section className="rounded-xl border border-border/60 bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">
                            Contact & notes
                        </h2>
                        <div className="grid gap-2">
                            <Label htmlFor="contact_number">Contact number</Label>
                            <Input
                                id="contact_number"
                                value={data.contact_number}
                                onChange={(e) =>
                                    setData('contact_number', e.target.value)
                                }
                                placeholder="09XXXXXXXXX"
                                required
                            />
                            <InputError message={errors.contact_number} />
                        </div>
                        <div className="mt-4 grid gap-2">
                            <Label htmlFor="notes">
                                Notes{' '}
                                <span className="text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Any instructions for the seller…"
                                className="min-h-16"
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </section>

                    <section className="rounded-xl border border-border/60 bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">
                            Payment
                        </h2>
                        <div className="grid gap-2">
                            {paymentMethods.map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                                        data.payment_method === opt.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value={opt.value}
                                        checked={
                                            data.payment_method === opt.value
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'payment_method',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        {data.payment_method === 'gcash' && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                After placing the order you'll see the store's
                                GCash details — pay, then enter your reference
                                number to confirm.
                            </p>
                        )}
                        <InputError
                            className="mt-2"
                            message={errors.payment_method}
                        />
                    </section>

                    <section className="rounded-xl border border-border/60 bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">
                            Order summary
                        </h2>
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-muted-foreground">
                                        {item.name} × {item.quantity}
                                    </span>
                                    <span className="text-foreground">
                                        {formatPrice(item.line_total)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Delivery fee
                                </span>
                                <span>{formatPrice(deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between pt-1 text-base font-semibold text-foreground">
                                <span>Total</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                        </div>

                        <InputError
                            className="mt-2"
                            message={(errors as Record<string, string>).cart}
                        />
                    </section>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full"
                    >
                        Place order
                    </Button>
                </form>
            </div>
        </>
    );
}
