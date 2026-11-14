import { defineHandler } from "nitro";
import { readBody, createError, type H3Event } from "nitro/h3";
import {
  GUEST_LINK_TTL_MS,
  PRESETS,
  createJourney,
  toOwnerView,
  type Preset,
  type JourneyKind,
} from "../../lib/journey";
import { getBearer, getClientIp, isRateLimited, newToken, sha256 } from "../../lib/security";
import { requireSupabaseUser, supabaseServerClient } from "../../lib/guardianAuth";

async function requireLinkedChild(event: H3Event): Promise<string> {
  const user = await requireSupabaseUser(event);
  const { data, error } = await supabaseServerClient()
    .from("child_accounts")
    .select("child_auth_id")
    .eq("child_auth_id", user.id)
    .not("consumed_at", "is", null)
    .maybeSingle();
  if (error || !data?.child_auth_id) {
    throw createError({ statusCode: 403, statusMessage: "child_link_required" });
  }
  return data.child_auth_id;
}

export default defineHandler(async (event) => {
  const ip = getClientIp(event);
  if (isRateLimited(`create:${ip}`, 20, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: "too_many_requests" });
  }

  const body = (await readBody(event).catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    throw createError({ statusCode: 400, statusMessage: "invalid_body" });
  }

  const preset = String(body.preset ?? "");
  if (!PRESETS.includes(preset as Preset)) {
    throw createError({ statusCode: 400, statusMessage: "invalid_preset" });
  }

  const durationMinutes = Number(body.durationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 10080) {
    throw createError({ statusCode: 400, statusMessage: "invalid_duration" });
  }

  const maxLabelLength = body.journeyKind === "child" ? 240 : 100;
  const label = String(body.label ?? "").slice(0, maxLabelLength);
  const senderName = String(body.senderName ?? "").slice(0, 60).trim() || "Someone";
  const contact = String(body.contact ?? "").slice(0, 100).trim();
  const isDemo = false;
  const journeyKind: JourneyKind = body.journeyKind === "child" ? "child" : "standard";
  const locationEnabled = body.locationEnabled === true;

  const provided = getBearer(event);
  const ownerSecret = provided ?? newToken();
  const linkedChildAuthId = journeyKind === "child" ? await requireLinkedChild(event) : null;

  const now = Date.now();
  const journey = createJourney({
    ownerSecretHash: sha256(ownerSecret),
    ownerName: senderName,
    preset: preset as Preset,
    label,
    expectedArrivalAt: now + Math.round(durationMinutes * 60_000),
    isDemo,
    guestToken: newToken(),
    guestExpiresAt: now + GUEST_LINK_TTL_MS,
    contact,
    journeyKind,
    childAuthId: linkedChildAuthId,
    locationEnabled,
  });

  return {
    journey: toOwnerView(journey),
    ownerSecret: provided ? null : ownerSecret,
    sharePath: `/j/${journey.guest_token}`,
  };
});
