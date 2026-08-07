<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    @foreach ($staticUrls as $entry)
    <url>
        <loc>{{ $entry['url'] }}</loc>
        <changefreq>{{ $entry['changefreq'] }}</changefreq>
        <priority>{{ $entry['priority'] }}</priority>
    </url>
    @endforeach
    @foreach ($stores as $store)
    <url>
        <loc>{{ url("/stores/{$store->id}") }}</loc>
        <lastmod>{{ $store->updated_at->toAtomString() }}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
    </url>
    @endforeach
</urlset>
