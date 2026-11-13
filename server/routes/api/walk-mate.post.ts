import { defineHandler } from "nitro";
import { createError, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import { getClientIp, isRateLimited } from "../../lib/security";
import { sanitizeText } from "../../lib/sanitize";
import { createCode, createId, createSecretToken, createWalkMate } from "../../lib/db";

const schema = z.object({
  ownerName: z.string().trim().min(2).max(60),
});

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`walk-mate-create:${getClientIp(event)}`, 8, 60 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: "rate_limited",
      message: "You have started several walks in a short time. Please try again later.",
    });
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
      message: parsed.error.issues[0]?.message || "Enter your name to start a walk.",
    });
  }

  const token = createCode(6);
  const ownerToken = createSecretToken();
  const ownerParticipantToken = createSecretToken();
  const result = createWalkMate({
    token,
    ownerToken,
    ownerName: sanitizeText(parsed.data.ownerName, 60),
    ownerId: createId("wm"),
    ownerParticipantToken,
  });

  return {
    token,
    ownerToken,
    participantToken: ownerParticipantToken,
    participantId: result.owner.id,
    role: "owner" as const,
    status: result.journey.status,
    createdAt: result.journey.created_at,
  };
});
