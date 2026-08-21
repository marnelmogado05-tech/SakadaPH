import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import {
    Circle,
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
} from 'react-leaflet';
import StockLevel from '@/components/stock-level';
import type { StockState } from '@/components/stock-level';
import { show as storesShow } from '@/routes/stores';

export type MapStore = {
    id: number;
    name: string;
    address: string;
    type: string | null;
    distance_km: number | null;
    store_availability: StockState;
    latitude: number | null;
    longitude: number | null;
};

type Props = {
    stores: MapStore[];
    userLat: number | null;
    userLng: number | null;
    maxDistanceKm: number | null;
    hoveredStoreId: number | null;
};

/**
 * Leaflet builds markers from raw HTML strings, so they can't take Tailwind
 * classes — but CSS custom properties still inherit into those nodes, which
 * keeps the markers on the same tokens as the list and theme-reactive for free.
 */
const AVAILABILITY_COLORS: Record<StockState, string> = {
    in_stock: 'var(--stock-full)',
    low_stock: 'var(--stock-low)',
    out_of_stock: 'var(--stock-empty)',
    no_products: 'var(--stock-none)',
};

const TYPE_LABELS: Record<string, string> = {
    pickup: 'Pickup',
    delivery: 'Delivery',
    both: 'Pickup & Delivery',
};

// Philippines geographic center as fallback
const PH_CENTER: [number, number] = [12.8797, 121.774];

function makeStoreIcon(
    availability: StockState,
    highlighted: boolean,
): L.DivIcon {
    const color = AVAILABILITY_COLORS[availability];
    const s = highlighted ? 20 : 12;
    const border = highlighted ? 3 : 2;
    const shadow = highlighted
        ? '0 2px 8px rgba(0,0,0,0.45)'
        : '0 1px 4px rgba(0,0,0,0.3)';

    return L.divIcon({
        className: '',
        html: `<div style="width:${s}px;height:${s}px;background:${color};border-radius:50%;border:${border}px solid var(--card);box-shadow:${shadow}"></div>`,
        iconSize: [s, s],
        iconAnchor: [s / 2, s / 2],
        popupAnchor: [0, -(s / 2 + 4)],
    });
}

function makeUserIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:var(--primary);border-radius:50%;border:3px solid var(--card);box-shadow:0 0 0 4px color-mix(in oklab, var(--primary) 30%, transparent)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    });
}

const USER_ICON = makeUserIcon();

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    const prevRef = useRef({ lat, lng });

    useEffect(() => {
        if (prevRef.current.lat === lat && prevRef.current.lng === lng) {
            return;
        }

        prevRef.current = { lat, lng };
        map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 1.5 });
    }, [lat, lng, map]);

    return null;
}

export default function StoresMap({
    stores,
    userLat,
    userLng,
    maxDistanceKm,
    hoveredStoreId,
}: Props) {
    const mappable = stores.filter(
        (s) => s.latitude !== null && s.longitude !== null,
    );
    const hasUser = userLat !== null && userLng !== null;

    const center: [number, number] = hasUser ? [userLat!, userLng!] : PH_CENTER;
    const zoom = hasUser ? 13 : 6;

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom
            style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {hasUser && (
                <>
                    <RecenterMap lat={userLat!} lng={userLng!} />
                    <Marker position={[userLat!, userLng!]} icon={USER_ICON}>
                        <Popup>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                Your location
                            </span>
                        </Popup>
                    </Marker>
                    {maxDistanceKm && (
                        <Circle
                            center={[userLat!, userLng!]}
                            radius={maxDistanceKm * 1000}
                            pathOptions={{
                                // Leaflet writes stroke/fill as SVG presentation
                                // attributes, which don't accept var() — so the
                                // colour comes from a CSS rule on this class.
                                className: 'stores-map-radius',
                                fillOpacity: 0.06,
                                weight: 1.5,
                                dashArray: '4 4',
                            }}
                        />
                    )}
                </>
            )}

            {mappable.map((store) => {
                const highlighted = store.id === hoveredStoreId;

                return (
                    <Marker
                        key={store.id}
                        position={[store.latitude!, store.longitude!]}
                        icon={makeStoreIcon(
                            store.store_availability,
                            highlighted,
                        )}
                        zIndexOffset={highlighted ? 1000 : 0}
                    >
                        <Popup>
                            <div
                                style={{ minWidth: '160px', maxWidth: '200px' }}
                            >
                                <p
                                    style={{
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        marginBottom: '3px',
                                    }}
                                >
                                    {store.name}
                                </p>
                                {store.type && (
                                    <p
                                        style={{
                                            fontSize: '11px',
                                            color: 'var(--muted-foreground)',
                                            marginBottom: '2px',
                                        }}
                                    >
                                        {TYPE_LABELS[store.type] ?? store.type}
                                    </p>
                                )}
                                {store.distance_km !== null && (
                                    <p
                                        style={{
                                            fontSize: '11px',
                                            color: 'var(--muted-foreground)',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        <span className="font-display font-semibold tabular-nums">
                                            {store.distance_km} km
                                        </span>{' '}
                                        away
                                    </p>
                                )}

                                <div style={{ marginBottom: '8px' }}>
                                    <StockLevel
                                        state={store.store_availability}
                                        size="sm"
                                    />
                                </div>
                                <a
                                    href={storesShow.url(store.id)}
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: 'var(--primary)',
                                        textDecoration: 'none',
                                    }}
                                >
                                    View details →
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
