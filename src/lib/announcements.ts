import { supabase } from "@/integrations/supabase/client";

export type AnnouncementSeverity = "info" | "warning" | "emergency";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  published: boolean;
}

const SEVERITY_ORDER: Record<AnnouncementSeverity, number> = {
  emergency: 0,
  warning: 1,
  info: 2,
};

export async function listPublishedAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title,
      body: input.body,
      severity: input.severity,
      published: input.published,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Announcement;
}

export async function updateAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>,
): Promise<void> {
  const { error } = await supabase
    .from("announcements")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}
