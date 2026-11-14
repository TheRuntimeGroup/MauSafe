import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomPassword(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const code = String(body?.code ?? "").replace(/\D/g, "");

    if (!EMAIL_PATTERN.test(email)) {
      return json({ error: "INVALID_EMAIL" });
    }
    if (code.length !== 6) {
      return json({ error: "INVALID_CODE" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: codes, error: lookupError } = await supabase
      .from("verification_codes")
      .select("id, code_hash, expires_at, consumed_at")
      .eq("email", email)
      .eq("purpose", "login")
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lookupError) {
      console.error("[verify-login] verification code lookup failed", lookupError);
      return json({ error: "UNKNOWN" });
    }

    const record = codes?.[0];
    if (!record) {
      return json({ error: "INVALID_CODE" });
    }

    const codeHash = await sha256Hex(code);
    if (record.code_hash !== codeHash) {
      return json({ error: "INVALID_CODE" });
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return json({ error: "EXPIRED_CODE" });
    }

    const { data: userId, error: userIdError } = await supabase
      .rpc("auth_user_id_by_email", { target_email: email });

    if (userIdError || !userId) {
      console.error("[verify-login] failed to resolve user id", userIdError);
      return json({ error: "ACCOUNT_NOT_FOUND" });
    }

    const tempPassword = randomPassword();
    const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });

    if (passwordError) {
      console.error("[verify-login] failed to set temporary password", passwordError);
      return json({ error: "UNKNOWN" });
    }

    const { error: consumeError } = await supabase
      .from("verification_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", record.id)
      .is("consumed_at", null);

    if (consumeError) {
      console.error("[verify-login] failed to consume verification code", consumeError);
    }

    return json({ ok: true, email, tempPassword });
  } catch (error) {
    console.error("[verify-login] unexpected error", error);
    return json({ error: "UNKNOWN" });
  }
});
