import { defineHandler } from "nitro";
import { createError } from "nitro/h3";
import { listJourneysByOwner, toOwnerView } from "../../lib/journey";
import { getBearer, getClientIp, isRateLimited, sha256 } from "../../lib/security";

export default defineHandler((event) => {
  const ip = getClientIp(event);
  if (isRateLimited(`list:${ip}`, 60, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: "too_many_requests" });
  }

  const secret = getBearer(event);
  if (!secret) {
    throw createError({ statusCode: 401, statusMessage: "unauthorized" });
  }

  const rows = listJourneysByOwner(sha256(secret));
  return { journeys: rows.map(toOwnerView) };
});
