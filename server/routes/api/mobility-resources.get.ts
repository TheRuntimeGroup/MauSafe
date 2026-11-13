import { defineHandler } from "nitro";
import { createError } from "nitro/h3";

type OsmTags = Record<string, string | undefined>;
type OsmElement = {
  id: number;
  type: "node" | "way" | "relation";
  tags?: OsmTags;
};

type Resource = {
  id: string;
  name: string;
  street: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  sourceUrl: string;
  wheelchairAccessible: boolean;
};

const RELEVANT_NAME = /disab|handicap|invalid|wheelchair|rehabilit|mobility|empower|enable|crippl|infirm/i;
let cache: { expiresAt: number; resources: Resource[] } | null = null;

function text(value: unknown, maxLength = 160): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function publicWebsite(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default defineHandler(async () => {
  if (cache && cache.expiresAt > Date.now()) return { resources: cache.resources };

  const query = `
    [out:json][timeout:18];
    area["ISO3166-1"="MU"][boundary=administrative]->.mauritius;
    (
      node["office"~"^(ngo|charity|social_facility)$"](area.mauritius);
      way["office"~"^(ngo|charity|social_facility)$"](area.mauritius);
      relation["office"~"^(ngo|charity|social_facility)$"](area.mauritius);
      node["amenity"="social_facility"](area.mauritius);
      way["amenity"="social_facility"](area.mauritius);
      relation["amenity"="social_facility"](area.mauritius);
    );
    out center 60;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "MauSafe/1.0 accessibility-resources",
    },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw createError({ statusCode: 503, statusMessage: "Support directory unavailable" });
  }

  const payload = (await response.json()) as { elements?: OsmElement[] };
  const resources = (payload.elements ?? [])
    .filter((element) => {
      const name = element.tags?.name ?? "";
      const description = `${name} ${element.tags?.description ?? ""} ${element.tags?.["description:en"] ?? ""}`;
      return name.trim().length > 0 && RELEVANT_NAME.test(description);
    })
    .map((element): Resource => {
      const tags = element.tags ?? {};
      return {
        id: `${element.type}-${element.id}`,
        name: tags.name!.trim().slice(0, 160),
        street: text(tags["addr:street"]),
        city: text(tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"]),
        phone: text(tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"], 40),
        email: text(tags.email ?? tags["contact:email"], 120),
        website: publicWebsite(tags.website ?? tags["contact:website"] ?? tags.url),
        sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        wheelchairAccessible: tags.wheelchair === "yes",
      };
    })
    .sort((a, b) => Number(b.wheelchairAccessible) - Number(a.wheelchairAccessible)
      || Number(Boolean(b.phone || b.email || b.website)) - Number(Boolean(a.phone || a.email || a.website))
      || a.name.localeCompare(b.name))
    .slice(0, 6);

  cache = { expiresAt: Date.now() + 24 * 60 * 60 * 1000, resources };
  return { resources };
});
