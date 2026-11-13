import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { requireOwnerJourney } from "../../../../lib/guard";
import { computeStatus, toOwnerView, updateJourneyLocation } from "../../../../lib/journey";
import { getClientIp, isRateLimited } from "../../../../lib/security";

export default defineHandler(async (event) => {
  const ip = getClientIp(event);
  if (isRateLimited(`location:${ip}`, 120, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: "too_many_requests" });
  }

  const row = requireOwnerJourney(event);
  const status = computeStatus(row);
  if (status !== "on_the_way" && status !== "overdue") {
    throw createError({ statusCode: 409, statusMessage: "journey_not_active" });
  }
  if (row.location_enabled !== 1 || !row.location_consent_at) {
    throw createError({ statusCode: 403, statusMessage: "location_not_enabled" });
  }

  const body = (await readBody(event).catch(() => null)) as Record<string, unknown> | null;
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const rawAccuracy = body?.accuracy === null ? null : Number(body?.accuracy);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw createError({ statusCode: 400, statusMessage: "invalid_coordinates" });
  }
  const accuracy =
    rawAccuracy !== null && Number.isFinite(rawAccuracy) && rawAccuracy >= 0 && rawAccuracy <= 100000
      ? rawAccuracy
      : null;

  const updated = updateJourneyLocation(row.id, latitude, longitude, accuracy);
  return { journey: toOwnerView(updated!) };
});
