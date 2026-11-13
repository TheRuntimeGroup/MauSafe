import { defineHandler } from "nitro";
import { createError, getRouterParam, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import { getClientIp, isRateLimited } from "../../lib/security";
import { getWalkMateByOwnerToken, getWalkMateByToken, setWalkMateStatus } from "../../lib/db";

const schema = z.object({
  ownerToken: z.string().min(20),
  status: z.enum(["arrived", "cancelled"]),
});

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`walk-mate-status:${getClientIp(event)}`, 15, 10 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: "rate_limited",
      message: "Too many status changes. Please wait a moment.",
    });
  }

  const token = (getRouterParam(event, "token") || "").toUpperCase();
  const journey = getWalkMateByToken(token);
  if (!journey) {
    throw createError({ statusCode: 404, statusMessage: "not_found", message: "No walk was found with that code." });
  }

  let body: unknown;
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "invalid_input", message: "The request body is not valid JSON." });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "invalid_input", message: "The status change is not valid." });
  }

  const ownedJourney = getWalkMateByOwnerToken(parsed.data.ownerToken);
  if (!ownedJourney || ownedJourney.token !== token) {
    throw createError({ statusCode: 403, statusMessage: "forbidden", message: "Only the person who started this walk can end it." });
  }

  const updated = setWalkMateStatus(token, parsed.data.status);
  return {
    token: updated?.token,
    status: updated?.status,
    updatedAt: updated?.updated_at,
  };
});
