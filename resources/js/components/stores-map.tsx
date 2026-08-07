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
import { show as storesShow } from '@/routes/stores';

type StoreAvailability =
    'in_stock' | 'low_stock' | 'out_of_stock' | 'no_products';

export type MapStore = {
    id: number;
    name: string;
    address: string;
    type: string | null;
    distance_km: number | null;
    store_availability: StoreAvailability;
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

const AVAILABILITY_COLORS: Record<StoreAvailability, string> = {
    in_stock: '#16a34a',
    low_stock: '#d97706',
    out_of_stock: '#dc2626',
    no_products: '#9ca3af',
};

const TYPE_LABELS: Record<string, string> = {
    pickup: 'Pickup',
    delivery: 'Delivery',
    both: 'Pickup & Delivery',
};

// Philippines geographic center as fallback
const PH_CENTER: [number, number] = [12.8797, 121.774];

function makeStoreIcon(
    availability: StoreAvailability,
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
        html: `<div style="width:${s}px;height:${s}px;background:${color};border-radius:50%;border:${border}px solid white;box-shadow:${shadow}"></div>`,
        iconSize: [s, s],
        iconAnchor: [s / 2, s / 2],
        popupAnchor: [0, -(s / 2 + 4)],
    });
}

function makeUserIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(37,99,235,0.6)"></div>`,
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
                                color: '#2563eb',
                                fillColor: '#2563eb',
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
                                            color: '#6b7280',
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
                                            color: '#6b7280',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        {store.distance_km} km away
                                    </p>
                                )}
                                <a
                                    href={storesShow.url(store.id)}
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#2563eb',
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
