import { defineHandler } from "nitro";
import { createError, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import { getClientIp, isRateLimited } from "../../lib/security";
import { sanitizeText } from "../../lib/sanitize";
import { createCode, createId, createSafeHaven } from "../../lib/db";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(["business", "home", "community_centre", "place_of_worship", "other"]),
  description: z.string().trim().min(10).max(600),
  address: z.string().trim().min(4).max(200),
  latitude: z.number().min(-20.7).max(-19.8),
  longitude: z.number().min(57.2).max(57.95),
  contactName: z.string().trim().min(2).max(120),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are authorised to list this place." }),
  }),
});

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`safe-haven:${getClientIp(event)}`, 5, 60 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: "rate_limited",
      message: "You have submitted several places in a short time. Please try again later.",
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
      message: parsed.error.issues[0]?.message || "Please check the details and try again.",
    });
  }

  const { name, category, description, address, latitude, longitude, contactName } = parsed.data;
  const token = createCode(6);
  const haven = createSafeHaven({
    id: createId("sh"),
    token,
    name: sanitizeText(name, 120),
    category,
    description: sanitizeText(description, 600),
    address: sanitizeText(address, 200),
    latitude,
    longitude,
    contactName: sanitizeText(contactName, 120),
  });

  return {
    id: haven.id,
    token,
    status: haven.status,
    message: "Your safe haven was submitted for review. Keep this tracking code to check its status.",
  };
});
