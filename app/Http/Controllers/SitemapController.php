<?php

namespace App\Http\Controllers;

use App\Enums\SellerStatus;
use App\Models\Store;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $stores = Store::where('status', SellerStatus::Approved)
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'updated_at']);

        $staticUrls = [
            ['url' => url('/'), 'priority' => '1.0', 'changefreq' => 'daily'],
            ['url' => url('/stores'), 'priority' => '0.9', 'changefreq' => 'hourly'],
        ];

        $xml = view('sitemap', [
            'staticUrls' => $staticUrls,
            'stores' => $stores,
        ])->render();

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }
}
