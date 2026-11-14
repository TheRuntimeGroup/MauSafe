import { createClient, type User } from "@supabase/supabase-js";
import { createError, getRequestHeader, type H3Event } from "nitro/h3";

const SUPABASE_URL = "https://nnpxakcemcbavjigbriz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UT_8xn__dVG_DguRqj80pQ_FsLJGBW3";

export function supabaseServerClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireSupabaseUser(event: H3Event): Promise<User> {
  const authorization = getRequestHeader(event, "authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    throw createError({ statusCode: 401, statusMessage: "unauthorized" });
  }
  const { data: { user }, error } = await supabaseServerClient().auth.getUser(authorization.slice(7).trim());
  if (error || !user) throw createError({ statusCode: 401, statusMessage: "unauthorized" });
  return user;
}

export async function requireChildLink(childAuthId: string, guardianId: string) {
  const { data, error } = await supabaseServerClient()
    .from("child_accounts")
    .select("child_auth_id,child_name,child_email,guardian_user_id,guardian_name")
    .eq("child_auth_id", childAuthId)
    .eq("guardian_user_id", guardianId)
    .not("consumed_at", "is", null)
    .maybeSingle();
  if (error || !data || data.guardian_user_id !== guardianId) {
    throw createError({ statusCode: 403, statusMessage: "child_link_not_found" });
  }
  return data;
}
