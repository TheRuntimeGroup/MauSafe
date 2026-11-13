import raw from "./help-directory.json";
import supplied from "./mauritius-contacts.json";

export type HelpCategory = "immediate" | "police_station" | "family_safety" | "online_fraud" | "hospital" | "utility";

export interface HelpEntry {
  id: string;
  serviceName: string;
  category: HelpCategory;
  locality: string;
  division: string | null;
  phone: string | null;
  phoneVerified: boolean;
  action: "tel" | "url" | null;
  url: string | null;
  sourceUrl: string | null;
  dateChecked: string | null;
  address?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  sourceLabel?: string | null;
  directionsQuery?: string | null;
  phoneOptions?: string[];
}

export interface HelpDatasetMeta {
  schemaVersion: number;
  title: string;
  description: string;
  sourceUrls: string[];
  coverage: string;
  generatedAt: string | null;
}

type SuppliedEmergency = { service: string; number: string; note: string; source: string };
type SuppliedHospital = {
  name: string;
  type: string;
  district: string;
  address: string;
  phone: string;
  alt_phone: string;
  source: string;
};
type SuppliedStation = { name: string; division: string; phones: string; email: string; type: string };

const suppliedData = supplied as {
  emergency: SuppliedEmergency[];
  hospitals: SuppliedHospital[];
  police_stations: SuppliedStation[];
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function primaryPhone(value: string): string | null {
  const match = value.match(/(?:\+230\s*)?(?:\d{3}\s*\d{4}|\d{3})(?=\s|$|\/)/);
  return match?.[0].trim() || null;
}

function sourceUrl(source: string): string | null {
  const normalized = source.toLowerCase();
  if (normalized.includes("police.govmu.org")) return "https://police.govmu.org/";
  if (normalized.includes("health.govmu.org")) return "https://health.govmu.org/";
  if (normalized.includes("govmu.org")) return "https://govmu.org/";
  if (normalized.includes("ceb.mu")) return "https://ceb.mu/";
  if (normalized.includes("cwa.mu")) return "https://www.cwa.mu/";
  return null;
}

const emergencyEntries: HelpEntry[] = suppliedData.emergency.map((entry, index) => {
  const family = /child|family|mineurs/i.test(entry.service);
  const utility = /^(CEB|CWA)/.test(entry.service);
  return {
    id: `supplied-service-${index}-${slug(entry.service)}`,
    serviceName: entry.service,
    category: family ? "family_safety" : utility ? "utility" : "immediate",
    locality: "Mauritius",
    division: null,
    phone: primaryPhone(entry.number),
    phoneVerified: !!primaryPhone(entry.number),
    action: "tel",
    url: null,
    sourceUrl: sourceUrl(entry.source),
    dateChecked: null,
    address: entry.note,
    sourceLabel: entry.source,
  };
});

const hospitalEntries: HelpEntry[] = suppliedData.hospitals.map((entry, index) => {
  const phone = primaryPhone(entry.phone || entry.alt_phone);
  return {
    id: `supplied-hospital-${index}-${slug(entry.name)}`,
    serviceName: entry.name,
    category: entry.type === "Emergency service" ? "immediate" : "hospital",
    locality: entry.district,
    division: entry.district === "National" ? null : entry.district,
    phone,
    phoneVerified: !!phone,
    action: "tel",
    url: null,
    sourceUrl: sourceUrl(entry.source),
    dateChecked: null,
    address: `${entry.address} · ${entry.type}`,
    alternatePhone: entry.phone && entry.alt_phone ? entry.alt_phone : null,
    sourceLabel: entry.source,
    directionsQuery: `${entry.name}, ${entry.address}, Mauritius`,
  };
});

const stationEntries: HelpEntry[] = suppliedData.police_stations.map((entry, index) => {
  const phone = primaryPhone(entry.phones);
  return {
    id: `supplied-station-${index}-${slug(entry.name)}`,
    serviceName: entry.name,
    category: "police_station",
    locality: entry.name.replace(/ Police (Station|Post).*$/, ""),
    division: entry.division,
    phone,
    phoneVerified: !!phone,
    action: "tel",
    url: null,
    sourceUrl: "https://police.govmu.org/",
    dateChecked: null,
    address: `${entry.type} · Other listed lines: ${entry.phones}`,
    email: entry.email || null,
    sourceLabel: "Project-owner supplied Mauritius Police directory",
    directionsQuery: `${entry.name}, ${entry.division}, Mauritius`,
  };
});

const suppliedEntries = [...emergencyEntries, ...hospitalEntries, ...stationEntries];
const seenServices = new Set(suppliedEntries.map((entry) => entry.serviceName.toLowerCase()));
const baseEntries = (raw as { entries: HelpEntry[] }).entries.filter(
  (entry) => !seenServices.has(entry.serviceName.toLowerCase()),
);

export const HELP_META: HelpDatasetMeta = {
  ...(raw as { meta: HelpDatasetMeta }).meta,
  description:
    "MauSafe directory combining official-source seed data with the project-owner supplied national services, hospitals and police stations.",
  coverage:
    "112 directory entries: 20 national services, 20 hospitals and 72 police stations, plus MAUCORS+ and family-safety seed entries. Listed sources are shown; users should confirm critical numbers before relying on them.",
};

export const HELP_ENTRIES: HelpEntry[] = [...suppliedEntries, ...baseEntries];

export const HELP_CATEGORIES: { id: HelpCategory | "all"; labelKey: string }[] = [
  { id: "all", labelKey: "help.category.all" },
  { id: "immediate", labelKey: "help.category.immediate" },
  { id: "police_station", labelKey: "help.category.police" },
  { id: "hospital", labelKey: "help.category.hospital" },
  { id: "family_safety", labelKey: "help.category.family" },
  { id: "online_fraud", labelKey: "help.category.fraud" },
  { id: "utility", labelKey: "help.category.utility" },
];

function callableAlternate(value: string | null | undefined): string | null {
  if (!value || !/^[+\d\s()-]+$/.test(value)) return null;
  return primaryPhone(value);
}

function groupHelpEntries(entries: HelpEntry[]): HelpEntry[] {
  const groups = new Map<string, HelpEntry>();
  for (const entry of entries) {
    const key = [entry.serviceName, entry.category, entry.locality, entry.division ?? ""].join("|");
    const phones = [entry.phone, callableAlternate(entry.alternatePhone)].filter(
      (phone): phone is string => !!phone,
    );
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { ...entry, phoneOptions: Array.from(new Set(phones)) });
      continue;
    }
    existing.phoneOptions = Array.from(new Set([...(existing.phoneOptions ?? []), ...phones]));
    existing.phoneVerified = existing.phoneVerified || entry.phoneVerified;
    if (entry.address && !(existing.address ?? "").includes(entry.address)) {
      existing.address = [existing.address, entry.address].filter(Boolean).join(" · ");
    }
    if (entry.sourceLabel && entry.sourceLabel !== existing.sourceLabel) {
      existing.sourceLabel = [existing.sourceLabel, entry.sourceLabel].filter(Boolean).join(" · ");
    }
  }
  return Array.from(groups.values());
}

export function searchHelp(
  query: string,
  category: HelpCategory | "all",
  division: string,
): HelpEntry[] {
  const q = query.trim().toLowerCase();
  const filtered = HELP_ENTRIES.filter((entry) => {
    if (category !== "all" && entry.category !== category) return false;
    if (division !== "all" && (entry.division ?? "unknown") !== division) return false;
    if (!q) return true;
    const haystack = [
      entry.serviceName,
      entry.locality,
      entry.division ?? "",
      entry.address ?? "",
      entry.email ?? "",
      entry.category,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
  return groupHelpEntries(filtered);
}

export function helpDivisions(): string[] {
  const set = new Set<string>();
  for (const entry of HELP_ENTRIES) set.add(entry.division ?? "unknown");
  return Array.from(set).sort();
}
