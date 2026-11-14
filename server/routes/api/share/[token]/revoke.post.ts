import { defineHandler } from "nitro";
import { createError, getRouterParam } from "nitro/h3";
import { requireSupabaseUser, supabaseServerClient } from "../../../lib/guardianAuth";

export default defineHandler(async (event) => {
  const token = String(getRouterParam(event, "token") ?? "");
  const user = await requireSupabaseUser(event);
  const { data, error } = await supabaseServerClient()
    .from("quick_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("share_token", token)
    .eq("owner_id", user.id)
    .is("revoked_at", null)
    .select("id");

  if (error) throw createError({ statusCode: 500, statusMessage: "revoke_failed" });
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: "share_not_found" });
  return { ok: true };
});
