import { defineHandler, useRuntimeConfig } from "nitro";
import { createError, getRequestURL, readBody } from "nitro/h3";
import { requireSupabaseUser, supabaseServerClient } from "../../../lib/guardianAuth";

export default defineHandler(async (event) => {
  const user = await requireSupabaseUser(event);
  const body = await readBody<{ recipientEmail?: string; latitude?: number; longitude?: number; accuracy?: number | null }>(event).catch(() => null);
  const recipient = String(body?.recipientEmail ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw createError({ statusCode: 400, statusMessage: "email_recipient_required" });
  }

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const accuracy = body.accuracy === null || typeof body.accuracy === "undefined" ? null : Number(body.accuracy);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw createError({ statusCode: 400, statusMessage: "invalid_coordinates" });
  }
  if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0) ) {
    throw createError({ statusCode: 400, statusMessage: "invalid_accuracy" });
  }

  const { data: profile } = await supabaseServerClient().from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { error } = await supabaseServerClient().from("quick_shares").insert({
    owner_id: user.id,
    owner_name: profile?.full_name || user.email,
    recipient_email: recipient,
    latitude,
    longitude,
    accuracy,
    expires_at: expiresAt,
    share_token: token,
  });
  if (error) throw createError({ statusCode: 500, statusMessage: "quick_share_create_failed" });

  const config = useRuntimeConfig();
  const origin = typeof config.public.appOrigin === "string" && /^https?:\/\//.test(config.public.appOrigin)
    ? config.public.appOrigin
    : getRequestURL(event).origin;
  const url = new URL(`/share/${token}`, origin).toString();
  const senderName = profile?.full_name || user.email || "MauSafe user";
  let emailSent = false;

  if (config.resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: String(config.resendFrom ?? "MauSafe <no-reply@anousecuremoris.site>"),
        to: [recipient],
        subject: `${senderName} shared their location for 1 hour`,
        text: `${senderName} shared a location with you. This link expires at ${expiresAt}.\n$${url}`.replace("$", ""),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    emailSent = response.ok;
  }

  return { ok: true, url, expiresAt, emailSent };
});
