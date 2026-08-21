import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import ProductController from '@/actions/App/Http/Controllers/Seller/ProductController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { index as productsIndex } from '@/routes/seller/products';

type AvailabilityOption = {
    value: string;
    label: string;
};

type Product = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    unit: string;
    quantity: number;
    availability: string;
    image_url: string | null;
};

export default function ProductsEdit({
    product,
    availabilityOptions,
}: {
    product: Product;
    availabilityOptions: AvailabilityOption[];
}) {
    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        name: string;
        description: string;
        price: string;
        unit: string;
        quantity: string;
        availability: string;
        image: File | null;
    }>({
        _method: 'PUT',
        name: product.name,
        description: product.description ?? '',
        price: product.price,
        unit: product.unit,
        quantity: String(product.quantity),
        availability: product.availability,
        image: null,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(product.image_url);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('image', file);

        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    }

    function clearImage() {
        setData('image', null);
        setPreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(ProductController.update.url(product.id), { forceFormData: true });
    }

    return (
        <>
            <Head title="Edit product" />

            <div className="px-4 py-6">
                <Link
                    href={productsIndex()}
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    Back to products
                </Link>

                <Heading
                    title="Edit product"
                    description="Update the details for this product"
                />

                <form onSubmit={submit} className="max-w-xl space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Round Trip Delivery — 5 Gallon"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Price (₱)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full"
                                value={data.price}
                                onChange={(e) =>
                                    setData('price', e.target.value)
                                }
                                placeholder="0.00"
                                required
                            />
                            <InputError message={errors.price} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                                id="unit"
                                name="unit"
                                className="mt-1 block w-full"
                                value={data.unit}
                                onChange={(e) =>
                                    setData('unit', e.target.value)
                                }
                                placeholder="e.g. gallon, liter"
                                required
                            />
                            <InputError message={errors.unit} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity in stock</Label>
                        <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            min="0"
                            className="mt-1 block w-full"
                            value={data.quantity}
                            onChange={(e) =>
                                setData('quantity', e.target.value)
                            }
                            required
                        />
                        <InputError message={errors.quantity} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="availability">Availability</Label>
                        <select
                            id="availability"
                            name="availability"
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                            value={data.availability}
                            onChange={(e) =>
                                setData('availability', e.target.value)
                            }
                        >
                            {availabilityOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.availability} />
                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Product image{' '}
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </Label>

                        {preview ? (
                            <div className="relative mt-1 w-40">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="h-40 w-40 rounded-lg border border-border object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-on-destructive shadow"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-1 flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                            >
                                <ImagePlus className="size-6" />
                                <span className="text-xs">Upload image</span>
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                        <InputError message={errors.image} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">
                            Description{' '}
                            <span className="text-muted-foreground">
                                (optional)
                            </span>
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            className="mt-1 min-h-24 w-full"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Describe this product…"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            Save changes
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={productsIndex()}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ProductsEdit.layout = {
    breadcrumbs: [
        { title: 'Products', href: productsIndex() },
        { title: 'Edit product', href: '#' },
    ],
};
