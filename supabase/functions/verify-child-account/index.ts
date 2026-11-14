import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PURPOSE = "child_account";

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
  if (req.method !== "POST") {
    return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return json({ error: "UNAUTHORIZED" });
    }
    const token = authorization.slice(7).trim();

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "UNAUTHORIZED" });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const childName = String(body?.childName ?? "").trim().slice(0, 60);
    const childEmail = String(body?.childEmail ?? "").trim().toLowerCase();
    const code = String(body?.code ?? "").replace(/\D/g, "");

    if (!childName || !EMAIL_PATTERN.test(childEmail) || childEmail === user.email?.toLowerCase()) {
      return json({ error: "INVALID_CHILD_DETAILS" });
    }
    if (code.length !== 6) {
      return json({ error: "INVALID_CODE" });
    }

    const { data: guardian } = await admin
      .from("profiles")
      .select("account_type,full_name")
      .eq("id", user.id)
      .single();

    if (guardian?.account_type === "child") {
      return json({ error: "GUARDIAN_REQUIRED" });
    }

    const guardianName = guardian?.full_name || user.email || "Guardian";

    const { data: codes, error: lookupError } = await admin
      .from("verification_codes")
      .select("id,code_hash,expires_at,consumed_at")
      .eq("email", childEmail)
      .eq("purpose", PURPOSE)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lookupError) {
      console.error("[verify-child-account] verification code lookup failed", lookupError);
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

    const { data: registeredUserId, error: registeredError } = await admin
      .rpc("auth_user_id_by_email", { target_email: childEmail });

    if (registeredError) {
      console.error("[verify-child-account] failed to resolve existing user", registeredError);
      return json({ error: "UNKNOWN" });
    }

    const { data: link, error: linkLookupError } = await admin
      .from("child_accounts")
      .select("id,child_auth_id,child_name,consumed_at")
      .eq("guardian_user_id", user.id)
      .eq("child_email", childEmail)
      .maybeSingle();

    if (linkLookupError) {
      console.error("[verify-child-account] failed to read child link", linkLookupError);
      return json({ error: "UNKNOWN" });
    }

    // Idempotent retry: if this guardian already linked this child, succeed without re-creating.
    if (link?.consumed_at) {
      return json({ ok: true, childName: link.child_name, childEmail, alreadyLinked: true });
    }

    let childAuthId: string | undefined = link?.child_auth_id ?? undefined;

    if (registeredUserId) {
      if (childAuthId && childAuthId !== registeredUserId) {
        return json({ error: "EMAIL_TAKEN" });
      }
      if (!childAuthId) {
        return json({ error: "EMAIL_TAKEN" });
      }
    } else if (!childAuthId) {
      const { data: child, error: createError } = await admin.auth.admin.createUser({
        email: childEmail,
        password: randomPassword(),
        email_confirm: true,
      });

      if (createError || !child.user) {
        console.error("[verify-child-account] unable to create child auth user", createError);
        return json({ error: "EMAIL_TAKEN" });
      }
      childAuthId = child.user.id;
    }

    const nowIso = new Date().toISOString();
    // pair_code_hash/expires_at are legacy NOT NULL columns; store placeholders that
    // cannot be used to sign in, keeping the schema intact for the new OTP flow.
    const placeholderHash = await sha256Hex(`child-account-placeholder:${childAuthId}:${nowIso}`);

    const { error: upsertLinkError } = await admin
      .from("child_accounts")
      .upsert(
        {
          guardian_user_id: user.id,
          guardian_name: guardianName,
          guardian_email: user.email,
          child_name: childName,
          child_email: childEmail,
          child_auth_id: childAuthId,
          pair_code_hash: placeholderHash,
          expires_at: nowIso,
          consumed_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "guardian_user_id,child_email" },
      );

    if (upsertLinkError) {
      console.error("[verify-child-account] failed to store child link", upsertLinkError);
      return json({ error: "UNKNOWN" });
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: childAuthId,
      full_name: childName,
      account_type: "child",
      onboarding_completed: true,
      updated_at: nowIso,
    });

    if (profileError) {
      console.error("[verify-child-account] failed to upsert child profile", profileError);
      return json({ error: "UNKNOWN" });
    }

    await admin.from("kid_game_results").upsert({
      user_id: childAuthId,
      updated_at: nowIso,
    });

    const { error: consumeError } = await admin
      .from("verification_codes")
      .update({ consumed_at: nowIso, verified_at: nowIso })
      .eq("id", record.id)
      .is("consumed_at", null);

    if (consumeError) {
      console.error("[verify-child-account] failed to consume verification code", consumeError);
    }

    return json({ ok: true, childName, childEmail });
  } catch (error) {
    console.error("[verify-child-account] unexpected error", error);
    return json({ error: "UNKNOWN" });
  }
});
