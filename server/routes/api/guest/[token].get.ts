import { defineHandler } from "nitro";
import { createError, getRouterParam } from "nitro/h3";
import { getJourneyByToken, toGuestView } from "../../../lib/journey";
import { getClientIp, isRateLimited } from "../../../lib/security";

export default defineHandler((event) => {
  const ip = getClientIp(event);
  if (isRateLimited(`guest:${ip}`, 120, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: "too_many_requests" });
  }

  const token = getRouterParam(event, "token");
  const row = token ? getJourneyByToken(token) : null;
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "link_not_found" });
  }
  if (row.guest_revoked_at) {
    throw createError({ statusCode: 410, statusMessage: "link_revoked" });
  }
  if (Date.now() > row.guest_expires_at) {
    throw createError({ statusCode: 410, statusMessage: "link_expired" });
  }

  return { journey: toGuestView(row) };
});
