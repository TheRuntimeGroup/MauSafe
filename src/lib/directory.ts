export type DirectoryKind = "hospital" | "police" | "fire" | "shelter";

export interface DirectoryEntry {
  id: string;
  kind: DirectoryKind;
  name: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  note?: string;
}

export const directoryEntries: DirectoryEntry[] = [
  // Public hospitals
  {
    id: "hospital-jeetoo",
    kind: "hospital",
    name: "Dr A. G. Jeetoo Hospital",
    area: "Port Louis",
    address: "Volcy Pougnet Street, Port Louis",
    latitude: -20.1657,
    longitude: 57.5081,
    phone: "212 3201",
  },
  {
    id: "hospital-ssrn",
    kind: "hospital",
    name: "SSRN Hospital",
    area: "Pamplemousses",
    address: "Royal Road, Pamplemousses",
    latitude: -20.1036,
    longitude: 57.5732,
    phone: "243 3980",
  },
  {
    id: "hospital-victoria",
    kind: "hospital",
    name: "Victoria Hospital",
    area: "Candos",
    address: "Candos, Quatre Bornes",
    latitude: -20.2642,
    longitude: 57.4755,
    phone: "425 3030",
  },
  {
    id: "hospital-nehru",
    kind: "hospital",
    name: "Jawaharlal Nehru Hospital",
    area: "Rose Belle",
    address: "Rose Belle",
    latitude: -20.4695,
    longitude: 57.5951,
    phone: "627 5100",
  },
  {
    id: "hospital-flacq",
    kind: "hospital",
    name: "Flacq Hospital",
    area: "Flacq",
    address: "Central Flacq",
    latitude: -20.2001,
    longitude: 57.7103,
    phone: "413 2532",
  },
  {
    id: "hospital-souillac",
    kind: "hospital",
    name: "Souillac Hospital",
    area: "Savanne",
    address: "Souillac",
    latitude: -20.5188,
    longitude: 57.5281,
    phone: "625 5500",
  },

  // Police stations
  {
    id: "police-central",
    kind: "police",
    name: "Central Police Station",
    area: "Port Louis",
    address: "Line Barracks, Port Louis",
    latitude: -20.1646,
    longitude: 57.5064,
    phone: "999 / 112",
  },
  {
    id: "police-quatre-bornes",
    kind: "police",
    name: "Quatre Bornes Police Station",
    area: "Quatre Bornes",
    address: "Avenue des Rosiers, Quatre Bornes",
    latitude: -20.265,
    longitude: 57.479,
    phone: "999 / 112",
  },
  {
    id: "police-curepipe",
    kind: "police",
    name: "Curepipe Police Station",
    area: "Curepipe",
    address: "Royal Road, Curepipe",
    latitude: -20.316,
    longitude: 57.526,
    phone: "999 / 112",
  },
  {
    id: "police-goodlands",
    kind: "police",
    name: "Goodlands Police Station",
    area: "Rivière du Rempart",
    address: "Goodlands",
    latitude: -20.035,
    longitude: 57.646,
    phone: "999 / 112",
  },
  {
    id: "police-mahebourg",
    kind: "police",
    name: "Mahebourg Police Station",
    area: "Grand Port",
    address: "Mahebourg",
    latitude: -20.408,
    longitude: 57.7,
    phone: "999 / 112",
  },

  // Fire and rescue
  {
    id: "fire-port-louis",
    kind: "fire",
    name: "Fire & Rescue Service HQ",
    area: "Port Louis",
    address: "Port Louis",
    latitude: -20.165,
    longitude: 57.506,
    phone: "115",
  },
  {
    id: "fire-quatre-bornes",
    kind: "fire",
    name: "Fire Station — Quatre Bornes",
    area: "Quatre Bornes",
    address: "Quatre Bornes",
    latitude: -20.266,
    longitude: 57.478,
    phone: "115",
  },
  {
    id: "fire-curepipe",
    kind: "fire",
    name: "Fire Station — Curepipe",
    area: "Curepipe",
    address: "Curepipe",
    latitude: -20.315,
    longitude: 57.525,
    phone: "115",
  },
  {
    id: "fire-flacq",
    kind: "fire",
    name: "Fire Station — Flacq",
    area: "Flacq",
    address: "Central Flacq",
    latitude: -20.2,
    longitude: 57.71,
    phone: "115",
  },

  // Community centres commonly opened as cyclone refuges
  {
    id: "shelter-rose-hill",
    kind: "shelter",
    name: "Rose Hill Community Centre",
    area: "Plaines Wilhems",
    address: "Rose Hill",
    latitude: -20.242,
    longitude: 57.472,
    note: "Confirm it is open with your district council or NDDRMC before travelling.",
  },
  {
    id: "shelter-triolet",
    kind: "shelter",
    name: "Triolet Community Centre",
    area: "Pamplemousses",
    address: "Triolet",
    latitude: -20.056,
    longitude: 57.545,
    note: "Confirm it is open with your district council or NDDRMC before travelling.",
  },
  {
    id: "shelter-goodlands",
    kind: "shelter",
    name: "Goodlands Community Centre",
    area: "Rivière du Rempart",
    address: "Goodlands",
    latitude: -20.034,
    longitude: 57.647,
    note: "Confirm it is open with your district council or NDDRMC before travelling.",
  },
  {
    id: "shelter-mahebourg",
    kind: "shelter",
    name: "Mahebourg Village Hall",
    area: "Grand Port",
    address: "Mahebourg",
    latitude: -20.407,
    longitude: 57.7,
    note: "Confirm it is open with your district council or NDDRMC before travelling.",
  },
  {
    id: "shelter-pointe-aux-sables",
    kind: "shelter",
    name: "Pointe aux Sables Community Centre",
    area: "Port Louis",
    address: "Pointe aux Sables",
    latitude: -20.163,
    longitude: 57.458,
    note: "Confirm it is open with your district council or NDDRMC before travelling.",
  },
];

export const directoryKindMeta: Record<
  DirectoryKind,
  { label: string; plural: string; description: string }
> = {
  hospital: {
    label: "Hospital",
    plural: "Hospitals",
    description: "Public hospitals. For life-threatening emergencies, call an ambulance first.",
  },
  police: {
    label: "Police station",
    plural: "Police stations",
    description: "Police stations shown for orientation. In an emergency, call 999 or 112.",
  },
  fire: {
    label: "Fire station",
    plural: "Fire & rescue",
    description: "Fire and rescue stations. For fire or rescue emergencies, call 115.",
  },
  shelter: {
    label: "Cyclone shelter",
    plural: "Cyclone shelters",
    description: "Community centres commonly opened as cyclone refuges. Always verify before travelling.",
  },
};

export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function mapsDirectionsUrl(entry: DirectoryEntry): string {
  const query = encodeURIComponent(`${entry.name}, ${entry.address}, Mauritius`);
  return `https://www.google.com/maps/dir/?api=1&destination=${entry.latitude},${entry.longitude}&destination_place_id=&travelmode=driving&q=${query}`;
}
