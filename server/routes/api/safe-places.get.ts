import { defineHandler } from "nitro";
import { createError, getQuery } from "nitro/h3";

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const latitude = Number(query.lat);
  const longitude = Number(query.lon);
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    throw createError({ statusCode: 400, statusMessage: "invalid_coordinates" });
  }

  const roundedLat = latitude.toFixed(4);
  const roundedLon = longitude.toFixed(4);
  const overpassQuery = `[out:json][timeout:20];(
    nwr(around:2500,${roundedLat},${roundedLon})["amenity"~"police|hospital|clinic|doctors|pharmacy"];
    nwr(around:2500,${roundedLat},${roundedLon})["shop"~"convenience|supermarket"];
    nwr(around:2500,${roundedLat},${roundedLon})["tourism"="hotel"];
  );out center tags 50;`;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ data: overpassQuery }),
      signal: AbortSignal.timeout(23000),
    });
    if (!response.ok) throw new Error("Overpass unavailable");
    const data = (await response.json()) as { elements?: OverpassElement[] };
    const places = (data.elements ?? [])
      .map((element) => {
        const lat = element.lat ?? element.center?.lat;
        const lon = element.lon ?? element.center?.lon;
        const name = element.tags?.name?.trim();
        if (!lat || !lon || !name) return null;
        const kind = element.tags?.tourism === "hotel"
          ? "hotel"
          : element.tags?.shop
            ? "shop"
            : element.tags?.amenity ?? "help";
        return {
          id: `${element.type}-${element.id}`,
          name,
          kind,
          latitude: lat,
          longitude: lon,
          distanceKm: distanceKm(latitude, longitude, lat, lon),
          address: element.tags?.["addr:full"] ?? element.tags?.["addr:street"] ?? null,
          phone: element.tags?.phone ?? element.tags?.["contact:phone"] ?? null,
          openingHours: element.tags?.opening_hours ?? null,
          openStreetMapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        };
      })
      .filter((place): place is NonNullable<typeof place> => place !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    return { source: "OpenStreetMap contributors", places };
  } catch {
    throw createError({ statusCode: 503, statusMessage: "safe_places_unavailable" });
  }
});
