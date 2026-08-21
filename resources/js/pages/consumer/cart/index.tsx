import { Head, Link, router } from '@inertiajs/react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clear as cartClear } from '@/routes/cart';
import {
    destroy as cartItemDestroy,
    update as cartItemUpdate,
} from '@/routes/cart/items';
import { show as checkoutShow } from '@/routes/checkout';
import { index as storesIndex } from '@/routes/stores';

type CartStore = {
    id: number;
    name: string;
    type: string | null;
    min_order_amount: number | null;
    delivery_fee: number | null;
};

type CartItem = {
    id: number;
    product_id: number;
    name: string;
    unit: string;
    price: number;
    quantity: number;
    line_total: number;
    availability: string;
    image_url: string | null;
};

type Props = {
    store: CartStore | null;
    items: CartItem[];
    subtotal: number;
};

function formatPrice(value: number): string {
    return '₱' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function setQuantity(item: CartItem, quantity: number) {
    if (quantity < 1) {
        return;
    }

    router.patch(
        cartItemUpdate(item.id).url,
        { quantity },
        { preserveScroll: true },
    );
}

function removeItem(item: CartItem) {
    router.delete(cartItemDestroy(item.id).url, { preserveScroll: true });
}

export default function CartIndex({ store, items, subtotal }: Props) {
    const belowMinimum =
        store?.min_order_amount != null && subtotal < store.min_order_amount;
    const hasOutOfStock = items.some((i) => i.availability === 'out_of_stock');
    const canCheckout = items.length > 0 && !belowMinimum && !hasOutOfStock;

    return (
        <>
            <Head title="Your cart" />

            <div className="mx-auto max-w-2xl px-4 py-6">
                <h1 className="mb-1 text-lg font-semibold tracking-tight text-foreground">
                    Your cart
                </h1>
                {store && (
                    <p className="mb-6 text-sm text-muted-foreground">
                        From{' '}
                        <span className="font-medium text-foreground">
                            {store.name}
                        </span>
                    </p>
                )}

                {items.length === 0 ? (
                    <div className="rounded-xl border border-border/60 py-16 text-center">
                        <ShoppingCart className="mx-auto mb-3 size-8 text-muted-foreground" />
                        <p className="mb-4 text-sm text-muted-foreground">
                            Add water from a nearby supplier to start an order.
                        </p>
                        <Button asChild>
                            <Link href={storesIndex()}>Browse suppliers</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-4"
                                >
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="size-14 shrink-0 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="size-14 shrink-0 rounded-lg bg-secondary/40" />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatPrice(item.price)} /{' '}
                                            {item.unit}
                                        </p>
                                        {item.availability ===
                                            'out_of_stock' && (
                                            <p className="mt-1 text-xs font-medium text-destructive">
                                                Out of stock — remove to
                                                checkout
                                            </p>
                                        )}

                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setQuantity(
                                                        item,
                                                        item.quantity - 1,
                                                    )
                                                }
                                                disabled={item.quantity <= 1}
                                                className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="size-3.5" />
                                            </button>
                                            <span className="w-6 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setQuantity(
                                                        item,
                                                        item.quantity + 1,
                                                    )
                                                }
                                                className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-sm font-semibold text-foreground">
                                            {formatPrice(item.line_total)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item)}
                                            className="text-muted-foreground transition-colors hover:text-destructive"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-xl border border-border/60 bg-card p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span className="font-semibold text-foreground">
                                    {formatPrice(subtotal)}
                                </span>
                            </div>

                            {belowMinimum &&
                                store?.min_order_amount != null && (
                                    <p className="mt-2 text-xs text-attention">
                                        Minimum order is{' '}
                                        {formatPrice(store.min_order_amount)}.
                                        Add{' '}
                                        {formatPrice(
                                            store.min_order_amount - subtotal,
                                        )}{' '}
                                        more to checkout.
                                    </p>
                                )}

                            <Button
                                asChild={canCheckout}
                                disabled={!canCheckout}
                                className="mt-4 w-full"
                            >
                                {canCheckout ? (
                                    <Link href={checkoutShow()}>
                                        Proceed to checkout
                                    </Link>
                                ) : (
                                    <span>Proceed to checkout</span>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() =>
                                    router.delete(cartClear().url, {
                                        preserveScroll: true,
                                    })
                                }
                                className="mt-3 w-full text-center text-xs text-muted-foreground transition-colors hover:text-destructive"
                            >
                                Clear cart
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
