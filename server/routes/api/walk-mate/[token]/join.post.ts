import { defineHandler } from "nitro";
import { createError, getRouterParam, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import { getClientIp, isRateLimited } from "../../lib/security";
import { sanitizeText } from "../../lib/sanitize";
import { addWalkMateParticipant, createId, createSecretToken, getWalkMateByToken } from "../../lib/db";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
});

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`walk-mate-join:${getClientIp(event)}`, 12, 60 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: "rate_limited",
      message: "Too many join attempts. Please wait a moment and try again.",
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
    throw createError({
      statusCode: 400,
      statusMessage: "invalid_input",
      message: parsed.error.issues[0]?.message || "Enter your name to join the walk.",
    });
  }

  const participantToken = createSecretToken();
  const participant = addWalkMateParticipant({
    id: createId("wm"),
    journeyToken: token,
    name: sanitizeText(parsed.data.name, 60),
    participantToken,
  });

  return {
    token,
    participantToken,
    participantId: participant.id,
    role: "guest" as const,
    status: journey.status,
  };
});
