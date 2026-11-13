import { defineHandler } from "nitro";
import { createError, getRouterParam, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import { getClientIp, isRateLimited } from "../../lib/security";
import { getParticipantByToken, getWalkMateByToken, updateParticipantLocation } from "../../lib/db";

const schema = z.object({
  participantToken: z.string().min(20),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nullable().optional(),
});

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`walk-mate-location:${getClientIp(event)}`, 120, 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: "rate_limited",
      message: "Location updates are arriving too quickly. Please wait a moment.",
    });
  }

  const token = (getRouterParam(event, "token") || "").toUpperCase();
  const journey = getWalkMateByToken(token);
  if (!journey) {
    throw createError({ statusCode: 404, statusMessage: "not_found", message: "No walk was found with that code." });
  }
  if (journey.status !== "active") {
    throw createError({ statusCode: 409, statusMessage: "ended", message: "This walk has already ended." });
  }

  let body: unknown;
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "invalid_input", message: "The request body is not valid JSON." });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "invalid_input", message: "The location update is not valid." });
  }

  const participant = getParticipantByToken(parsed.data.participantToken);
  if (!participant || participant.journey_token !== token) {
    throw createError({ statusCode: 403, statusMessage: "forbidden", message: "This participant token is not part of this walk." });
  }

  const updated = updateParticipantLocation(
    parsed.data.participantToken,
    parsed.data.latitude,
    parsed.data.longitude,
    parsed.data.accuracy ?? null,
  );

  return {
    id: updated?.id,
    latitude: updated?.latitude,
    longitude: updated?.longitude,
    updatedAt: updated?.updated_at,
  };
});
