import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" });
    const token = authorization.slice(7).trim();

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return json({ error: "UNAUTHORIZED" });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const childName = String(body.childName ?? "").trim().slice(0, 60);
    const pairCode = String(body.pairCode ?? "").replace(/\D/g, "");
    if (!childName || pairCode.length !== 6) return json({ error: "INVALID_PAIR_DETAILS" });

    const { data: setup, error: lookupError } = await admin.from("child_accounts")
      .select("id,child_auth_id,pair_code_hash,expires_at,consumed_at,guardian_user_id")
      .eq("child_auth_id", user.id)
      .eq("child_email", user.email?.toLowerCase())
      .maybeSingle();
    if (lookupError) return json({ error: "PAIR_NOT_FOUND" });
    if (!setup) return json({ error: "PAIR_NOT_FOUND" });
    if (setup.consumed_at) return json({ error: "ALREADY_LINKED" });
    if (new Date(setup.expires_at).getTime() <= Date.now()) return json({ error: "EXPIRED_CODE" });
    if (setup.pair_code_hash !== await sha256Hex(`${pairCode}:${body.hashedToken}`)) {
      return json({ error: "INVALID_CODE" });
    }

    const { error: pairError } = await admin.from("child_accounts")
      .update({ consumed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", setup.id)
      .is("consumed_at", null);
    if (pairError) {
      console.error("[complete-child-pair] failed to store completed link", pairError);
      return json({ error: "SETUP_FAILED" });
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: user.id,
      full_name: childName,
      account_type: "child",
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    });
    if (profileError) return json({ error: "SETUP_FAILED" });

    await admin.from("kid_game_results").upsert({ user_id: user.id, updated_at: new Date().toISOString() });
    return json({ ok: true, guardianId: setup.guardian_user_id });
  } catch (error) {
    console.error("[complete-child-pair] unexpected error", error);
    return json({ error: "SETUP_FAILED" });
  }
});
