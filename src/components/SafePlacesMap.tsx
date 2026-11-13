import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useI18n } from "@/i18n/I18nContext";
import type { SafePlace } from "@/lib/safePlaces";
import "leaflet/dist/leaflet.css";

function pinIcon(color: string, size = 20) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 3px 10px rgba(7,27,51,.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function placeColor(kind: string) {
  if (kind === "police") return "#0A4C8C";
  if (["hospital", "clinic", "doctors", "pharmacy"].includes(kind)) return "#059669";
  if (kind === "hotel") return "#D97706";
  return "#7C3AED";
}

export function SafePlacesMap({
  center,
  places,
}: {
  center: { latitude: number; longitude: number };
  places: SafePlace[];
}) {
  const { t } = useI18n();
  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 shadow-premium">
      <MapContainer
        key={`${center.latitude}-${center.longitude}`}
        center={[center.latitude, center.longitude]}
        zoom={14}
        scrollWheelZoom={false}
        className="z-0 h-80 w-full sm:h-96"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[center.latitude, center.longitude]} icon={pinIcon("#071B33", 24)}>
          <Popup>{t("places.youAreHere")}</Popup>
        </Marker>
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={pinIcon(placeColor(place.kind))}
          >
            <Popup>
              <div className="space-y-1">
                <strong>{place.name}</strong>
                <p>{place.distanceKm.toFixed(1)} km</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-700"
                >
                  {t("places.directions")}
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
