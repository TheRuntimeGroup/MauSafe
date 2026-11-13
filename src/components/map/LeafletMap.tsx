import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

export type MapTone = "teal" | "red" | "amber" | "blue";

export interface LeafletMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  tone?: MapTone;
  variant?: "pin" | "dot";
}

const toneColors: Record<MapTone, string> = {
  teal: "#0D5C56",
  red: "#DC2626",
  amber: "#D97706",
  blue: "#2563EB",
};

function makeIcon(tone: MapTone, variant: "pin" | "dot") {
  const color = toneColors[tone];
  if (variant === "dot") {
    return L.divIcon({
      className: "anousecure-dot-marker",
      html: `<div style="width:22px;height:22px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 0 0 2px ${color}55, 0 2px 6px rgba(0,0,0,.35);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -12],
    });
  }
  return L.divIcon({
    className: "anousecure-pin-marker",
    html: `<svg width="34" height="34" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="#ffffff" stroke-width="1.4"/>
      <circle cx="12" cy="9" r="2.6" fill="#ffffff"/>
    </svg>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

function MapClickHandler({ onClick }: { onClick?: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) {
      onClick?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ markers }: { markers: LeafletMarker[] }) {
  const map = useMap();

  useEffect(() => {
    const points = markers
      .filter((marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude))
      .map((marker) => L.latLng(marker.latitude, marker.longitude));
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [42, 42], maxZoom: 15 });
  }, [markers, map]);

  return null;
}

export function LeafletMap({
  markers,
  center = [-20.25, 57.56],
  zoom = 10,
  className,
  fit = true,
}: {
  markers: LeafletMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  fit?: boolean;
}) {
  return (
    <div className={cn("relative z-0 overflow-hidden rounded-[1.5rem] border border-[#D6E0D7] bg-[#E7EDE7]", className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={makeIcon(marker.tone ?? "teal", marker.variant ?? "pin")}
          >
            <Popup>
              <div className="font-sans">
                <p className="text-sm font-bold text-[#17332F]">{marker.label}</p>
                {marker.description && <p className="mt-1 max-w-[240px] text-xs leading-5 text-[#5B6D67]">{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
        {fit && <FitBounds markers={markers} />}
      </MapContainer>
    </div>
  );
}
