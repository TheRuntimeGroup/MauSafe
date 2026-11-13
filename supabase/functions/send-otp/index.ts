import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "MauSafe <no-reply@anousecuremoris.site>";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_EMAIL_CODES_PER_HOUR = 5;
const MAX_NETWORK_CODES_PER_HOUR = 10;

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

function emailHtml(code: string): string {
  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#FCFAF5;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
          <div style="background:#0D2B45;border-radius:24px 24px 0 0;padding:28px 32px;">
            <div style="display:inline-block;background:#0D2B45;color:#ffffff;font-weight:800;font-size:20px;">MauSafe</div>
            <div style="font-size:11px;color:#b9d4ea;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Your verification code</div>
          </div>
          <div style="background:#ffffff;border:1px solid #E8E4DA;border-top:0;border-radius:0 0 24px 24px;padding:36px 32px;">
            <p style="margin:0 0 12px;color:#26354A;font-size:16px;line-height:1.5;">To finish creating your MauSafe account, enter this code in the app:</p>
            <div style="font-size:40px;font-weight:800;letter-spacing:0.35em;color:#0D2B45;padding:20px 0;text-align:center;">${code}</div>
            <p style="margin:0;color:#7A8496;font-size:13px;line-height:1.5;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      return json({ error: "INVALID_EMAIL" });
    }

    if (!RESEND_API_KEY) {
      console.error("[send-otp] RESEND_API_KEY is not configured");
      return json({ error: "EMAIL_NOT_CONFIGURED" });
    }

    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = String(array[0] % 1000000).padStart(6, "0");
    const codeHash = await sha256Hex(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const requestIpHash = await sha256Hex(`otp-request:${SUPABASE_SERVICE_ROLE_KEY}:${requestIp}`);
    const now = Date.now();

    const { data: latestCodes, error: latestError } = await supabase
      .from("verification_codes")
      .select("created_at")
      .eq("email", email)
      .eq("purpose", "signup")
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestError) {
      console.error("[send-otp] failed to check resend timer", latestError);
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
      supabase
        .from("verification_codes")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .eq("purpose", "signup")
        .gte("created_at", oneHourAgo),
      supabase
        .from("verification_codes")
        .select("id", { count: "exact", head: true })
        .eq("request_ip_hash", requestIpHash)
        .eq("purpose", "signup")
        .gte("created_at", oneHourAgo),
    ]);

    if (emailUsage.error || networkUsage.error) {
      console.error("[send-otp] failed to check hourly limits", emailUsage.error ?? networkUsage.error);
      return json({ error: "UNKNOWN" });
    }

    if ((emailUsage.count ?? 0) >= MAX_EMAIL_CODES_PER_HOUR) {
      return json({ error: "RATE_LIMITED", retryAfter: 3600 });
    }
    if ((networkUsage.count ?? 0) >= MAX_NETWORK_CODES_PER_HOUR) {
      return json({ error: "RATE_LIMITED", retryAfter: 3600 });
    }

    const { data: storedCode, error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        email,
        code_hash: codeHash,
        purpose: "signup",
        expires_at: expiresAt,
        request_ip_hash: requestIpHash,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[send-otp] failed to store verification code", insertError);
      return json({ error: "UNKNOWN" });
    }

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
          to: [email],
          subject: "Your MauSafe verification code",
          html: emailHtml(code),
        }),
      });
    } catch (error) {
      await supabase.from("verification_codes").delete().eq("id", storedCode.id);
      console.error("[send-otp] Resend request could not be completed", error);
      return json({ error: "EMAIL_NOT_CONFIGURED" });
    }

    if (!res.ok) {
      const detail = await res.text();
      await supabase.from("verification_codes").delete().eq("id", storedCode.id);
      console.error("[send-otp] Resend request failed", res.status, detail);
      return json({ error: "EMAIL_NOT_CONFIGURED" });
    }

    return json({ ok: true, expiresAt });
  } catch (error) {
    console.error("[send-otp] unexpected error", error);
    return json({ error: "UNKNOWN" });
  }
});
