import { defineHandler } from "nitro";
import { createError, getQuery } from "nitro/h3";

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string | undefined>;
};

type SafePlace = {
  id: string;
  name: string;
  kind: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  openStreetMapUrl: string;
};

const MAURITIUS = { minLat: -20.6, maxLat: -19.55, minLon: 57.25, maxLon: 63.6 };

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function inMauritius(latitude: number, longitude: number): boolean {
  return latitude >= MAURITIUS.minLat && latitude <= MAURITIUS.maxLat
    && longitude >= MAURITIUS.minLon && longitude <= MAURITIUS.maxLon;
}

function placeKind(tags: Record<string, string | undefined>): string {
  const amenity = tags.amenity ?? "";
  if (amenity === "police") return "police";
  if (["hospital", "clinic", "doctors", "pharmacy"].includes(amenity)) return amenity;
  if (amenity === "fire_station") return "emergency";
  if (["bus_station", "bus_stop", "taxi", "ferry_terminal"].includes(amenity) || tags.highway === "bus_stop") return "transport";
  if (["townhall", "courthouse", "customs", "library", "community_centre", "post_office"].includes(amenity)) return "government";
  if (tags.office === "government" || tags.office === "diplomatic") return "government";
  if (tags.tourism === "information") return "information";
  return "community";
}

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const latitude = Number(query.lat);
  const longitude = Number(query.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !inMauritius(latitude, longitude)) {
    throw createError({ statusCode: 400, statusMessage: "outside_mauritius" });
  }

  const roundedLat = latitude.toFixed(4);
  const roundedLon = longitude.toFixed(4);
  const overpassQuery = `[out:json][timeout:22];(
    nwr(around:5000,${roundedLat},${roundedLon})["amenity"~"^(police|hospital|clinic|doctors|pharmacy|fire_station)$"];
    nwr(around:5000,${roundedLat},${roundedLon})["amenity"~"^(bus_station|bus_stop|taxi|ferry_terminal)$"];
    nwr(around:5000,${roundedLat},${roundedLon})["highway"="bus_stop"];
    nwr(around:5000,${roundedLat},${roundedLon})["amenity"~"^(townhall|courthouse|customs|library|community_centre|post_office)$"];
    nwr(around:5000,${roundedLat},${roundedLon})["office"~"^(government|diplomatic)$"];
    nwr(around:5000,${roundedLat},${roundedLon})["tourism"="information"];
  );out center tags 50;`;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ data: overpassQuery }),
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new Error("Overpass unavailable");
    const data = (await response.json()) as { elements?: OverpassElement[] };

    const places = (data.elements ?? [])
      .map((element): SafePlace | null => {
        const latitude = element.lat ?? element.center?.lat;
        const longitude = element.lon ?? element.center?.lon;
        const name = element.tags?.name?.trim();
        if (latitude === undefined || longitude === undefined || !name || !inMauritius(latitude, longitude)) return null;

        return {
          id: `${element.type}-${element.id}`,
          name: name.slice(0, 160),
          kind: placeKind(element.tags ?? {}),
          latitude,
          longitude,
          distanceKm: distanceKm(Number(query.lat), Number(query.lon), latitude, longitude),
          address: element.tags?.["addr:full"] ?? element.tags?.["addr:street"] ?? null,
          phone: element.tags?.phone ?? element.tags?.["contact:phone"] ?? null,
          openingHours: element.tags?.opening_hours ?? null,
          openStreetMapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        };
      })
      .filter((place): place is SafePlace => place !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    return { source: "OpenStreetMap contributors", places };
  } catch {
    throw createError({ statusCode: 503, statusMessage: "safe_places_unavailable" });
  }
});
