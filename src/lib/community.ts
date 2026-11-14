import { supabase } from "@/integrations/supabase/client";

export type CommunityCategory = "safety" | "power_outage" | "infrastructure" | "disturbance" | "incident";
export type CommunityMedia = { url: string; type: "image" | "video"; name: string };

export const DISTRICTS = [
  "Port Louis",
  "Pamplemousses",
  "Rivière du Rempart",
  "Flacq",
  "Grand Port",
  "Savanne",
  "Moka",
  "Plaines Wilhems",
  "Black River",
  "Rodrigues",
] as const;

export const COMMUNITY_CATEGORIES: { id: CommunityCategory; labelKey: string }[] = [
  { id: "safety", labelKey: "community.category.safety" },
  { id: "power_outage", labelKey: "community.category.power_outage" },
  { id: "infrastructure", labelKey: "community.category.infrastructure" },
  { id: "disturbance", labelKey: "community.category.disturbance" },
  { id: "incident", labelKey: "community.category.incident" },
];

export function isTrustedCommunityMediaUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.host === "nnpxakcemcbavjigbriz.supabase.co"
      && url.pathname.startsWith("/storage/v1/object/public/community-media/");
  } catch {
    return false;
  }
}

export async function uploadCommunityMedia(file: File): Promise<CommunityMedia> {
  const body = new FormData();
  body.set("file", file, file.name);
  const { data, error } = await supabase.functions.invoke("upload-community-media", { body });
  if (error || data?.error || typeof data?.url !== "string") {
    throw new Error(data?.error ?? "UPLOAD_FAILED");
  }
  if (!isTrustedCommunityMediaUrl(data.url)) throw new Error("UPLOAD_FAILED");
  return { url: data.url, type: data.type, name: data.name };
}
