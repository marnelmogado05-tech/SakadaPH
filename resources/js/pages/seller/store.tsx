import { Head, useForm } from '@inertiajs/react';
import StoreController from '@/actions/App/Http/Controllers/Seller/StoreController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
    };
    storeTypes: StoreType[];
};

export default function Store({ store, storeTypes }: StoreProps) {
    const { data, setData, patch, processing, errors } = useForm({
        name: store.name,
        description: store.description ?? '',
        address: store.address,
        contact_number: store.contact_number ?? '',
        type: store.type,
        latitude: store.latitude !== null ? String(store.latitude) : '',
        longitude: store.longitude !== null ? String(store.longitude) : '',
        service_radius_km: store.service_radius_km !== null ? String(store.service_radius_km) : '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
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
                                onChange={(e) => setData('name', e.target.value)}
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
                                onChange={(e) => setData('address', e.target.value)}
                                required
                                placeholder="e.g. 123 Main St, Ilocos Norte"
                            />
                            <InputError message={errors.address} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="contact_number">Contact number</Label>
                            <Input
                                id="contact_number"
                                name="contact_number"
                                className="mt-1 block w-full"
                                value={data.contact_number}
                                onChange={(e) => setData('contact_number', e.target.value)}
                                placeholder="e.g. 09123456789"
                            />
                            <InputError message={errors.contact_number} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Service type</Label>
                            <select
                                id="type"
                                name="type"
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
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
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Tell customers about your water supply business…"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div>
                            <h2 className="mb-4 text-sm font-medium text-foreground">
                                Location coordinates{' '}
                                <span className="font-normal text-muted-foreground">(optional)</span>
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
                                        onChange={(e) => setData('latitude', e.target.value)}
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
                                        onChange={(e) => setData('longitude', e.target.value)}
                                        placeholder="e.g. 120.5960"
                                    />
                                    <InputError message={errors.longitude} />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="service_radius_km">
                                Service radius (km){' '}
                                <span className="font-normal text-muted-foreground">(optional)</span>
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
                                onChange={(e) => setData('service_radius_km', e.target.value)}
                                placeholder="e.g. 5"
                            />
                            <InputError message={errors.service_radius_km} />
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
