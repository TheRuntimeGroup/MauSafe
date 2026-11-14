import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sixDigitCode() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" });
    const token = authorization.slice(7).trim();

    // Verify the caller with the anon key, then use the service role for
    // admin auth operations and database writes (which RLS would block).
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
    const childEmail = String(body.childEmail ?? "").trim().toLowerCase();
    if (!childName || !EMAIL_PATTERN.test(childEmail) || childEmail === user.email?.toLowerCase()) {
      return json({ error: "INVALID_CHILD_DETAILS" });
    }

    const { data: guardian } = await admin
      .from("profiles")
      .select("full_name,account_type")
      .eq("id", user.id)
      .single();
    if (guardian?.account_type === "child") return json({ error: "GUARDIAN_REQUIRED" });

    const { data: existing } = await admin.from("child_accounts")
      .select("id,child_auth_id,consumed_at")
      .eq("guardian_user_id", user.id)
      .eq("child_email", childEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.consumed_at) return json({ error: "ALREADY_LINKED" });

    let childAuthId = existing?.child_auth_id as string | undefined;
    let createdHere = false;
    const temporaryPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    if (!childAuthId) {
      const { data: child, error: createError } = await admin.auth.admin.createUser({
        email: childEmail,
        password: temporaryPassword,
        email_confirm: true,
      });
      if (createError || !child.user) {
        console.error("[guardian-create-child] unable to create child auth user", createError);
        return json({ error: "EMAIL_TAKEN" });
      }
      childAuthId = child.user.id;
      createdHere = true;
    } else {
      const { error: resetError } = await admin.auth.admin.updateUserById(childAuthId, { password: temporaryPassword });
      if (resetError) return json({ error: "SETUP_FAILED" });
    }

    const { data: magic, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: childEmail,
      password: temporaryPassword,
      options: {},
    });
    if (linkError || !magic.properties?.hashed_token) {
      if (createdHere) await admin.auth.admin.deleteUser(childAuthId);
      console.error("[guardian-create-child] unable to generate pairing link", linkError);
      return json({ error: "SETUP_FAILED" });
    }

    const pairCode = sixDigitCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error: insertError } = await admin.from("child_accounts").insert({
      guardian_user_id: user.id,
      guardian_name: guardian?.full_name || user.email || "Guardian",
      guardian_email: user.email,
      child_name: childName,
      child_email: childEmail,
      child_auth_id: childAuthId,
      pair_code_hash: await sha256Hex(`${pairCode}:${magic.properties.hashed_token}`),
      expires_at: expiresAt,
    });
    if (insertError) {
      if (createdHere) await admin.auth.admin.deleteUser(childAuthId);
      console.error("[guardian-create-child] unable to store pairing", insertError);
      return json({ error: "SETUP_FAILED" });
    }

    let emailSent = false;
    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MauSafe <no-reply@anousecuremoris.site>",
          to: [user.email],
          subject: "Your child pairing code",
          text: `Guardian pairing code: ${pairCode}\n\nChild: ${childName} (${childEmail})\nEnter this code on the child's device within 15 minutes to finish pairing.`,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      emailSent = response.ok;
      if (!emailSent) console.error("[guardian-create-child] Resend notification failed", response.status);
    }

    return json({
      ok: true,
      pairCode,
      hashedToken: magic.properties.hashed_token,
      childName,
      childEmail,
      guardianName: guardian?.full_name || user.email || "Guardian",
      guardianEmail: user.email,
      expiresAt,
      emailSent,
    });
  } catch (error) {
    console.error("[guardian-create-child] unexpected error", error);
    return json({ error: "SETUP_FAILED" });
  }
});
