import raw from "./help-directory.json";

export type HelpCategory = "immediate" | "police_station" | "family_safety" | "online_fraud";

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
}

export interface HelpDatasetMeta {
  schemaVersion: number;
  title: string;
  description: string;
  sourceUrls: string[];
  coverage: string;
  generatedAt: string | null;
}

export const HELP_META = (raw as { meta: HelpDatasetMeta }).meta;
export const HELP_ENTRIES = (raw as { entries: HelpEntry[] }).entries;

export const HELP_CATEGORIES: { id: HelpCategory | "all"; labelKey: string }[] = [
  { id: "all", labelKey: "help.category.all" },
  { id: "immediate", labelKey: "help.category.immediate" },
  { id: "police_station", labelKey: "help.category.police" },
  { id: "family_safety", labelKey: "help.category.family" },
  { id: "online_fraud", labelKey: "help.category.fraud" },
];

export function searchHelp(
  query: string,
  category: HelpCategory | "all",
  division: string,
): HelpEntry[] {
  const q = query.trim().toLowerCase();
  return HELP_ENTRIES.filter((entry) => {
    if (category !== "all" && entry.category !== category) return false;
    if (division !== "all" && (entry.division ?? "unknown") !== division) return false;
    if (!q) return true;
    const haystack = [entry.serviceName, entry.locality, entry.division ?? "", entry.category]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function helpDivisions(): string[] {
  const set = new Set<string>();
  for (const entry of HELP_ENTRIES) set.add(entry.division ?? "unknown");
  return Array.from(set).sort();
}
