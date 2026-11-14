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
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "MauSafe <no-reply@anousecuremoris.site>";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_EMAIL_CODES_PER_HOUR = 5;
const MAX_NETWORK_CODES_PER_HOUR = 10;
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

function sixDigitCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1_000_000).padStart(6, "0");
}

function emailHtml(code: string, childName: string): { subject: string; html: string } {
  return {
    subject: "Your MauSafe child account code",
    html: `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#FCFAF5;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
          <div style="background:#0D2B45;border-radius:24px 24px 0 0;padding:28px 32px;">
            <div style="display:inline-block;background:#0D2B45;color:#ffffff;font-weight:800;font-size:20px;">MauSafe</div>
            <div style="font-size:11px;color:#b9d4ea;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Child account setup</div>
          </div>
          <div style="background:#ffffff;border:1px solid #E8E4DA;border-top:0;border-radius:0 0 24px 24px;padding:36px 32px;">
            <p style="margin:0 0 12px;color:#26354A;font-size:16px;line-height:1.5;">A guardian is setting up a MauSafe account for <strong>${childName}</strong>. Enter this code in the app to finish:</p>
            <div style="font-size:40px;font-weight:800;letter-spacing:0.35em;color:#0D2B45;padding:20px 0;text-align:center;">${code}</div>
            <p style="margin:0;color:#7A8496;font-size:13px;line-height:1.5;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `,
  };
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

    if (!childName || !EMAIL_PATTERN.test(childEmail) || childEmail === user.email?.toLowerCase()) {
      return json({ error: "INVALID_CHILD_DETAILS" });
    }

    if (!RESEND_API_KEY) {
      console.error("[create-child-account] RESEND_API_KEY is not configured");
      return json({ error: "EMAIL_NOT_CONFIGURED" });
    }

    const { data: guardian } = await admin
      .from("profiles")
      .select("account_type,full_name")
      .eq("id", user.id)
      .single();

    if (guardian?.account_type === "child") {
      return json({ error: "GUARDIAN_REQUIRED" });
    }

    const { data: emailTaken, error: emailTakenError } = await admin
      .rpc("email_is_registered", { target_email: childEmail });

    if (emailTakenError) {
      console.error("[create-child-account] failed to check email availability", emailTakenError);
      return json({ error: "UNKNOWN" });
    }

    if (emailTaken === true) {
      const { data: existing } = await admin
        .from("child_accounts")
        .select("id,consumed_at")
        .eq("guardian_user_id", user.id)
        .eq("child_email", childEmail)
        .maybeSingle();

      if (existing?.consumed_at) {
        return json({ error: "ALREADY_LINKED" });
      }
      if (!existing) {
        return json({ error: "EMAIL_TAKEN" });
      }
    }

    const code = sixDigitCode();
    const codeHash = await sha256Hex(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const requestIpHash = await sha256Hex(`child-account:${SUPABASE_SERVICE_ROLE_KEY}:${requestIp}`);
    const now = Date.now();

    const { data: latestCodes, error: latestError } = await admin
      .from("verification_codes")
      .select("created_at")
      .eq("email", childEmail)
      .eq("purpose", PURPOSE)
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestError) {
      console.error("[create-child-account] failed to check resend timer", latestError);
      return json({ error: "UNKNOWN" });
    }

    const latest = latestCodes?.[0];
    if (latest) {
      const elapsedSeconds = (now - new Date(latest.created_at).getTime()) / 1000;
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        return json({
          error: "RATE_LIMITED",
          retryAfter: Math.max(1, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds)),
        });
      }
    }

    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const [emailUsage, networkUsage] = await Promise.all([
      admin
        .from("verification_codes")
        .select("id", { count: "exact", head: true })
        .eq("email", childEmail)
        .eq("purpose", PURPOSE)
        .gte("created_at", oneHourAgo),
      admin
        .from("verification_codes")
        .select("id", { count: "exact", head: true })
        .eq("request_ip_hash", requestIpHash)
        .eq("purpose", PURPOSE)
        .gte("created_at", oneHourAgo),
    ]);

    if (emailUsage.error || networkUsage.error) {
      console.error("[create-child-account] failed to check hourly limits", emailUsage.error ?? networkUsage.error);
      return json({ error: "UNKNOWN" });
    }

    if ((emailUsage.count ?? 0) >= MAX_EMAIL_CODES_PER_HOUR) {
      return json({ error: "RATE_LIMITED", retryAfter: 3600 });
    }
    if ((networkUsage.count ?? 0) >= MAX_NETWORK_CODES_PER_HOUR) {
      return json({ error: "RATE_LIMITED", retryAfter: 3600 });
    }

    const { data: storedCode, error: insertError } = await admin
      .from("verification_codes")
      .insert({
        email: childEmail,
        code_hash: codeHash,
        purpose: PURPOSE,
        expires_at: expiresAt,
        request_ip_hash: requestIpHash,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[create-child-account] failed to store verification code", insertError);
      return json({ error: "UNKNOWN" });
    }

    const emailContent = emailHtml(code, childName);

    let res: Response;
    try {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [childEmail],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });
    } catch (error) {
      await admin.from("verification_codes").delete().eq("id", storedCode.id);
      console.error("[create-child-account] Resend request could not be completed", error);
      return json({ error: "EMAIL_NOT_CONFIGURED" });
    }

    if (!res.ok) {
      const detail = await res.text();
      await admin.from("verification_codes").delete().eq("id", storedCode.id);
      console.error("[create-child-account] Resend request failed", res.status, detail);
      return json({ error: "EMAIL_NOT_CONFIGURED" });
    }

    return json({ ok: true, email: childEmail, expiresAt });
  } catch (error) {
    console.error("[create-child-account] unexpected error", error);
    return json({ error: "UNKNOWN" });
  }
});
