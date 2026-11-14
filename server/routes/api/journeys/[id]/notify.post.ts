import { defineHandler, useRuntimeConfig } from "nitro";
import { createError, getRequestURL, readBody } from "nitro/h3";
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
  const body = await readBody<{ mode?: string; recipientEmail?: string }>(event).catch(() => ({}));
  const isLocationShare = body.mode === "location";
  const recipient = String(body.recipientEmail ?? row.contact_info ?? "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(recipient)) {
    throw createError({ statusCode: 400, statusMessage: "email_recipient_required" });
  }
  if (isLocationShare && (row.latitude === null || row.longitude === null)) {
    throw createError({ statusCode: 400, statusMessage: "location_unavailable" });
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

  const sourceTime = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Indian/Mauritius",
    timeZoneName: "short",
  }).format(row.location_updated_at ? new Date(row.location_updated_at) : new Date());
  const safeMapUrl = isLocationShare
    ? `https://www.openstreetmap.org/?mlat=${Number(row.latitude).toFixed(6)}&mlon=${Number(row.longitude).toFixed(6)}#map=16/${Number(row.latitude).toFixed(6)}/${Number(row.longitude).toFixed(6)}`
    : privateLink;
  const safeShareUrl = escapeHtml(safeMapUrl);
  const subject = isLocationShare ? `Location shared by ${row.owner_name}` : `Safe journey update from ${row.owner_name}`;
  const emailText = isLocationShare
    ? `${row.owner_name} shared a location with you.\n\n${safeShareUrl}\n\nLast location update: ${sourceTime}. Accuracy is estimated by the device.`
    : `${row.owner_name} has started a safe journey check-in.\n\nNote: ${row.label || "No note added"}\nExpected arrival: ${arrival}\n\nView the private update link: ${privateLink}`;
  const emailMarkup = isLocationShare
    ? `<div style="background:#fff;border:1px solid #e2e8ee;border-radius:0 0 22px 22px;padding:30px"><p style="font-size:17px;line-height:1.6"><strong>${senderName}</strong> shared their available location with you through MauSafe.</p><p><a href="${safeShareUrl}" style="display:inline-block;background:#0d2b45;color:#fff;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:700">View location</a></p><p style="color:#64748b;font-size:12px">Last update: ${sourceTime}. Accuracy depends on the device and GPS conditions.</p></div>`
    : `<div style="background:#fff;border:1px solid #e2e8ee;border-top:0;border-radius:0 0 22px 22px;padding:30px"><p style="margin:0;font-size:16px;line-height:1.5"><strong>${senderName}</strong> has started a safe journey check-in so you know when to expect them.</p><div style="margin:22px 0;padding:16px;border-radius:14px;background:#f1f6fa;font-size:14px;line-height:1.7"><strong>Travel note:</strong> ${journeyNote}<br><strong>Expected arrival:</strong> ${arrival}</div><a href="${privateLink}" style="display:inline-block;background:#0d2b45;color:#fff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">View journey update</a><p style="margin:22px 0 0;color:#64748b;font-size:12px;line-height:1.5">Only open this link if you expected this message. This private update link has its own expiry time.</p></div></div></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [recipient],
      from: resendFrom,
      to: [recipient],
      subject,
      text: emailText,
      html: emailMarkup,
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
