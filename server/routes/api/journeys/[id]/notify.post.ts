import { defineHandler, useRuntimeConfig } from "nitro";
import { createError, getRequestURL } from "nitro/h3";
import { requireOwnerJourney } from "../../../../lib/guard";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

export default defineHandler(async (event) => {
  const row = requireOwnerJourney(event);
  const recipient = String(row.contact_info ?? "").trim();
  if (!EMAIL_PATTERN.test(recipient)) {
    throw createError({ statusCode: 400, statusMessage: "email_recipient_required" });
  }

  const config = useRuntimeConfig();
  const resendApiKey = String(config.resendApiKey ?? "");
  if (!resendApiKey) {
    throw createError({ statusCode: 503, statusMessage: "email_not_configured" });
  }

  const configuredOrigin = config.public.appOrigin as string | undefined;
  const origin = configuredOrigin && /^https?:\/\//.test(configuredOrigin)
    ? configuredOrigin
    : getRequestURL(event).origin;
  const privateLink = new URL(`/j/${row.guest_token}`, origin).toString();
  const senderName = escapeHtml(row.owner_name);
  const journeyNote = escapeHtml(row.label || "No note added");
  const arrival = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Indian/Mauritius",
    timeZoneName: "short",
  }).format(new Date(row.expected_arrival_at));
  const safeLink = escapeHtml(privateLink);
  const resendFrom = String(config.resendFrom ?? "MauSafe <no-reply@anousecuremoris.site>");

  const { isRateLimited, getClientIp } = await import("../../../../lib/security");
  if (isRateLimited(`notify:${getClientIp(event)}`, 6, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: "too_many_requests" });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [recipient],
      subject: `Safe journey update from ${row.owner_name}`,
      text: `${row.owner_name} has started a safe journey check-in.\n\nNote: ${row.label || "No note added"}\nExpected arrival: ${arrival}\n\nView the private update link: ${privateLink}`,
      html: `<!doctype html><html><body style="margin:0;background:#f7f5ef;font-family:Arial,sans-serif;color:#182635"><div style="max-width:560px;margin:auto;padding:32px 18px"><div style="background:#0d2b45;color:#fff;padding:26px 30px;border-radius:22px 22px 0 0"><div style="font-size:22px;font-weight:800">MauSafe</div><p style="margin:8px 0 0;color:#bad1e4;font-size:13px">Safe journey update</p></div><div style="background:#fff;border:1px solid #e2e8ee;border-top:0;border-radius:0 0 22px 22px;padding:30px"><p style="margin:0;font-size:16px;line-height:1.5"><strong>${senderName}</strong> has started a safe journey check-in so you know when to expect them.</p><div style="margin:22px 0;padding:16px;border-radius:14px;background:#f1f6fa;font-size:14px;line-height:1.7"><strong>Travel note:</strong> ${journeyNote}<br><strong>Expected arrival:</strong> ${arrival}</div><a href="${safeLink}" style="display:inline-block;background:#0d2b45;color:#fff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">View journey update</a><p style="margin:22px 0 0;color:#64748b;font-size:12px;line-height:1.5">Only open this link if you expected this message. This private update link has its own expiry time.</p></div></div></body></html>`,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[notify-journey] Resend delivery failed", response.status, detail);
    throw createError({ statusCode: 502, statusMessage: "email_delivery_failed" });
  }

  return { ok: true, delivery: "sent" };
});
