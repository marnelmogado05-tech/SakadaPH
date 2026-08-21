import { Form, Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import ProductController from '@/actions/App/Http/Controllers/Seller/ProductController';
import Heading from '@/components/heading';
import StockLevel from '@/components/stock-level';
import type { StockState } from '@/components/stock-level';
import { Button } from '@/components/ui/button';
import {
    index as productsIndex,
    create as productsCreate,
    availability as availabilityRoute,
} from '@/routes/seller/products';

type AvailabilityOption = {
    value: string;
    label: string;
};

type Product = {
    id: number;
    name: string;
    price: string;
    unit: string;
    quantity: number;
    availability: StockState;
    image_url: string | null;
};

type Props = {
    products: Product[];
    availabilityOptions: AvailabilityOption[];
};

function formatPrice(price: string): string {
    return (
        '₱' +
        parseFloat(price)
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    );
}

function availabilityBadgeClass(availability: StockState): string {
    if (availability === 'in_stock') {
        return 'bg-stock-full-wash text-stock-full';
    }

    if (availability === 'low_stock') {
        return 'bg-stock-low-wash text-stock-low';
    }

    if (availability === 'out_of_stock') {
        return 'bg-stock-empty-wash text-stock-empty';
    }

    return 'bg-stock-none-wash text-stock-none';
}

export default function ProductsIndex({
    products,
    availabilityOptions,
}: Props) {
    return (
        <>
            <Head title="Products" />

            <div className="px-4 py-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <Heading
                        title="Products"
                        description="Manage the products available in your store"
                    />
                    <Button asChild size="sm" className="shrink-0">
                        <Link href={productsCreate()}>
                            <Plus className="size-4" />
                            Add product
                        </Link>
                    </Button>
                </div>

                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 py-16 text-center">
                        <p className="text-sm font-medium text-foreground">
                            No products yet
                        </p>
                        <p className="mt-1 mb-4 text-sm text-muted-foreground">
                            Add your first product to start attracting
                            customers.
                        </p>
                        <Button asChild size="sm">
                            <Link href={productsCreate()}>
                                <Plus className="size-4" />
                                Add product
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border/60">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/60">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                        Price
                                    </th>
                                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                                        Quantity
                                    </th>
                                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                                        Status
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {products.map((product) => (
                                    <tr key={product.id} className="group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="size-9 shrink-0 rounded-md border border-border object-cover"
                                                    />
                                                ) : (
                                                    <div className="size-9 shrink-0 rounded-md border border-border/60 bg-secondary" />
                                                )}
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        {product.name}
                                                    </span>
                                                    <span className="ml-1 text-muted-foreground">
                                                        / {product.unit}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-display font-bold text-foreground tabular-nums">
                                            {formatPrice(product.price)}
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground tabular-nums sm:table-cell">
                                            {product.quantity}
                                        </td>
                                        <td className="hidden px-4 py-3 sm:table-cell">
                                            <Form
                                                action={availabilityRoute.url(
                                                    product.id,
                                                )}
                                                method="patch"
                                                options={{
                                                    preserveScroll: true,
                                                }}
                                            >
                                                {({ processing }) => (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <StockLevel
                                                            state={
                                                                product.availability
                                                            }
                                                            size="sm"
                                                            showLabel={false}
                                                        />
                                                        <select
                                                            name="availability"
                                                            defaultValue={
                                                                product.availability
                                                            }
                                                            onChange={(e) =>
                                                                e.currentTarget.form?.requestSubmit()
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            className={[
                                                                'inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                                                'border-0 bg-transparent ring-0 outline-none',
                                                                availabilityBadgeClass(
                                                                    product.availability,
                                                                ),
                                                            ].join(' ')}
                                                        >
                                                            {availabilityOptions.map(
                                                                (opt) => (
                                                                    <option
                                                                        key={
                                                                            opt.value
                                                                        }
                                                                        value={
                                                                            opt.value
                                                                        }
                                                                    >
                                                                        {
                                                                            opt.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </span>
                                                )}
                                            </Form>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    className="size-8"
                                                >
                                                    <Link
                                                        href={ProductController.edit.url(
                                                            product.id,
                                                        )}
                                                    >
                                                        <Pencil className="size-3.5" />
                                                        <span className="sr-only">
                                                            Edit
                                                        </span>
                                                    </Link>
                                                </Button>
                                                <Form
                                                    action={ProductController.destroy.url(
                                                        product.id,
                                                    )}
                                                    method="delete"
                                                    options={{
                                                        preserveScroll: true,
                                                    }}
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-destructive"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            <span className="sr-only">
                                                                Delete
                                                            </span>
                                                        </Button>
                                                    )}
                                                </Form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: productsIndex(),
        },
    ],
};
