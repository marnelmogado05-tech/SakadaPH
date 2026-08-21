import { Head, useForm } from '@inertiajs/react';
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import StoreController from '@/actions/App/Http/Controllers/Seller/StoreController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { edit } from '@/routes/seller/store';

type StoreType = {
    value: string;
    label: string;
};

type StoreProps = {
    store: {
        name: string;
        description: string | null;
        address: string;
        contact_number: string | null;
        type: string;
        latitude: number | null;
        longitude: number | null;
        service_radius_km: number | null;
        delivery_fee: number | null;
        min_order_amount: number | null;
        accepts_online_payment: boolean;
        gcash_number: string | null;
        gcash_qr_url: string | null;
    };
    storeTypes: StoreType[];
};

export default function Store({ store, storeTypes }: StoreProps) {
    const { data, setData, patch, post, transform, processing, errors } =
        useForm<{
            name: string;
            description: string;
            address: string;
            contact_number: string;
            type: string;
            latitude: string;
            longitude: string;
            service_radius_km: string;
            delivery_fee: string;
            min_order_amount: string;
            accepts_online_payment: boolean;
            gcash_number: string;
            gcash_qr: File | null;
        }>({
            name: store.name,
            description: store.description ?? '',
            address: store.address,
            contact_number: store.contact_number ?? '',
            type: store.type,
            latitude: store.latitude !== null ? String(store.latitude) : '',
            longitude: store.longitude !== null ? String(store.longitude) : '',
            service_radius_km:
                store.service_radius_km !== null
                    ? String(store.service_radius_km)
                    : '',
            delivery_fee:
                store.delivery_fee !== null ? String(store.delivery_fee) : '',
            min_order_amount:
                store.min_order_amount !== null
                    ? String(store.min_order_amount)
                    : '',
            accepts_online_payment: store.accepts_online_payment,
            gcash_number: store.gcash_number ?? '',
            gcash_qr: null,
        });

    const qrInputRef = useRef<HTMLInputElement>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);

    function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('gcash_qr', file);
        setQrPreview(file ? URL.createObjectURL(file) : null);
    }

    function clearQr() {
        setData('gcash_qr', null);
        setQrPreview(null);

        if (qrInputRef.current) {
            qrInputRef.current.value = '';
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (data.gcash_qr instanceof File) {
            // PHP can't parse multipart bodies on PATCH, so a file upload must go out as
            // POST with method spoofing (`_method: 'patch'`).
            transform((current) => ({ ...current, _method: 'patch' }));
            post(StoreController.update.url(), {
                preserveScroll: true,
                forceFormData: true,
            });

            return;
        }

        // No file — a normal JSON PATCH keeps every field intact.
        transform((current) => current);
        patch(StoreController.update.url(), { preserveScroll: true });
    }

    return (
        <>
            <Head title="Store details" />

            <div className="px-4 py-6">
                <Heading
                    title="Store details"
                    description="Update your store name, address, and contact information"
                />

                <div className="max-w-xl">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Store name</Label>
                            <Input
                                id="name"
                                name="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                                placeholder="e.g. Juan's Water Station"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                className="mt-1 block w-full"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                                required
                                placeholder="e.g. 123 Main St, Ilocos Norte"
                            />
                            <InputError message={errors.address} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="contact_number">
                                Contact number
                            </Label>
                            <Input
                                id="contact_number"
                                name="contact_number"
                                className="mt-1 block w-full"
                                value={data.contact_number}
                                onChange={(e) =>
                                    setData('contact_number', e.target.value)
                                }
                                placeholder="e.g. 09123456789"
                            />
                            <InputError message={errors.contact_number} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Service type</Label>
                            <select
                                id="type"
                                name="type"
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                                value={data.type}
                                onChange={(e) =>
                                    setData('type', e.target.value)
                                }
                            >
                                {storeTypes.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.type} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                className="mt-1 min-h-28 w-full"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Tell customers about your water supply business…"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div>
                            <h2 className="mb-4 text-sm font-medium text-foreground">
                                Location coordinates{' '}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="latitude">Latitude</Label>
                                    <Input
                                        id="latitude"
                                        name="latitude"
                                        type="number"
                                        step="any"
                                        min="-90"
                                        max="90"
                                        className="mt-1 block w-full"
                                        value={data.latitude}
                                        onChange={(e) =>
                                            setData('latitude', e.target.value)
                                        }
                                        placeholder="e.g. 18.1974"
                                    />
                                    <InputError message={errors.latitude} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="longitude">Longitude</Label>
                                    <Input
                                        id="longitude"
                                        name="longitude"
                                        type="number"
                                        step="any"
                                        min="-180"
                                        max="180"
                                        className="mt-1 block w-full"
                                        value={data.longitude}
                                        onChange={(e) =>
                                            setData('longitude', e.target.value)
                                        }
                                        placeholder="e.g. 120.5960"
                                    />
                                    <InputError message={errors.longitude} />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="service_radius_km">
                                Service radius (km){' '}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="service_radius_km"
                                name="service_radius_km"
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="100"
                                className="mt-1 block w-full"
                                value={data.service_radius_km}
                                onChange={(e) =>
                                    setData('service_radius_km', e.target.value)
                                }
                                placeholder="e.g. 5"
                            />
                            <InputError message={errors.service_radius_km} />
                        </div>

                        <div>
                            <h2 className="mb-4 text-sm font-medium text-foreground">
                                Ordering & payment
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="delivery_fee">
                                        Delivery fee (₱)
                                    </Label>
                                    <Input
                                        id="delivery_fee"
                                        name="delivery_fee"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full"
                                        value={data.delivery_fee}
                                        onChange={(e) =>
                                            setData(
                                                'delivery_fee',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                    />
                                    <InputError message={errors.delivery_fee} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="min_order_amount">
                                        Minimum order (₱)
                                    </Label>
                                    <Input
                                        id="min_order_amount"
                                        name="min_order_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full"
                                        value={data.min_order_amount}
                                        onChange={(e) =>
                                            setData(
                                                'min_order_amount',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                    />
                                    <InputError
                                        message={errors.min_order_amount}
                                    />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Delivery fee is charged per delivery order.
                                Leave blank for free delivery / no minimum.
                            </p>

                            <label className="mt-4 flex items-start gap-3">
                                <Checkbox
                                    checked={data.accepts_online_payment}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            'accepts_online_payment',
                                            checked === true,
                                        )
                                    }
                                />
                                <span className="text-sm">
                                    <span className="font-medium text-foreground">
                                        Accept GCash payment
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Customers pay your GCash number and
                                        enter their reference; you confirm
                                        receipt. Cash is always available.
                                    </span>
                                </span>
                            </label>
                            <InputError
                                className="mt-2"
                                message={errors.accepts_online_payment}
                            />

                            {data.accepts_online_payment && (
                                <div className="mt-4 space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="gcash_number">
                                            GCash number
                                        </Label>
                                        <Input
                                            id="gcash_number"
                                            name="gcash_number"
                                            className="block w-full"
                                            value={data.gcash_number}
                                            onChange={(e) =>
                                                setData(
                                                    'gcash_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="09XXXXXXXXX"
                                        />
                                        <InputError
                                            message={errors.gcash_number}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>
                                            GCash QR{' '}
                                            <span className="font-normal text-muted-foreground">
                                                (optional)
                                            </span>
                                        </Label>

                                        {qrPreview || store.gcash_qr_url ? (
                                            <div className="relative w-40">
                                                <img
                                                    src={
                                                        qrPreview ??
                                                        store.gcash_qr_url ??
                                                        undefined
                                                    }
                                                    alt="GCash QR"
                                                    className="h-40 w-40 rounded-lg border border-border object-cover"
                                                />
                                                {qrPreview && (
                                                    <button
                                                        type="button"
                                                        onClick={clearQr}
                                                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-on-destructive shadow"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    qrInputRef.current?.click()
                                                }
                                                className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                                            >
                                                <ImagePlus className="size-6" />
                                                <span className="text-xs">
                                                    Upload QR
                                                </span>
                                            </button>
                                        )}

                                        <input
                                            ref={qrInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleQrChange}
                                        />
                                        <InputError message={errors.gcash_qr} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing}>
                                Save
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Store.layout = {
    breadcrumbs: [
        {
            title: 'Store details',
            href: edit(),
        },
    ],
};
