import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                // latin-ext carries the peso sign (U+20B1); without it every
                // price falls back to a system face.
                bunny('Instrument Sans', {
                    weights: [400, 500, 600, 700],
                    subsets: ['latin', 'latin-ext'],
                }),
                bunny('Archivo Narrow', {
                    weights: [600, 700],
                    subsets: ['latin', 'latin-ext'],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
