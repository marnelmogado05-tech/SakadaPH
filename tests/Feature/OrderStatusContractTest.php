<?php

use App\Enums\OrderStatus;

/**
 * The `OrderState` union and `LIFECYCLE` map in
 * resources/js/components/order-status.tsx mirror this enum by hand. TypeScript
 * keeps the map exhaustive against the union, but nothing keeps the union
 * honest against PHP — so this guards the seam.
 */
it('keeps the frontend order lifecycle in step with the enum', function () {
    $component = base_path('resources/js/components/order-status.tsx');
    expect($component)->toBeReadableFile();

    $source = file_get_contents($component);

    foreach (OrderStatus::cases() as $case) {
        expect($source)
            ->toContain("'{$case->value}'")
            ->and($source)->toContain("{$case->value}: {");
    }

    // and nothing in the component that the enum no longer has
    preg_match('/const LIFECYCLE[^=]*=\s*\{(.*?)\n\};/s', $source, $m);
    preg_match_all('/^\s{4}(\w+):\s*\{/m', $m[1] ?? '', $found);

    $enumValues = array_map(fn (OrderStatus $c) => $c->value, OrderStatus::cases());

    expect(array_diff($found[1] ?? [], $enumValues))->toBeEmpty(
        'order-status.tsx maps a state the OrderStatus enum does not define.'
    );
    expect(count($found[1] ?? []))->toBe(count($enumValues));
});
