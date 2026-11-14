import { defineHandler } from "nitro";
import { createError, getRouterParam } from "nitro/h3";
import { supabaseServerClient } from "../../../lib/guardianAuth";

export default defineHandler(async (event) => {
  const token = String(getRouterParam(event, "token") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    throw createError({ statusCode: 400, statusMessage: "invalid_share_link" });
  }

  const { data: share, error } = await supabaseServerClient()
    .from("quick_shares")
    .select("owner_name,latitude,longitude,accuracy,source_at,expires_at,revoked_at")
    .eq("share_token", token)
    .maybeSingle();
  if (error) throw createError({ statusCode: 404, statusMessage: "share_not_found" });
  if (!share) throw createError({ statusCode: 404, statusMessage: "share_expired" });

  if (share.revoked_at || new Date(share.expires_at).getTime() <= Date.now()) {
    if (!share.revoked_at) {
      await supabaseServerClient().from("quick_shares").update({ revoked_at: new Date().toISOString() }).eq("share_token", token);
    }
    throw createError({ statusCode: 410, statusMessage: "share_expired" });
  }

  return {
    ownerName: share.owner_name,
    latitude: share.latitude,
    longitude: share.longitude,
    accuracy: share.accuracy,
    updatedAt: share.source_at,
    expiresAt: share.expires_at,
  };
});
