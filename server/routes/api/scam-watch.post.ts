import { defineHandler } from "nitro";
import { createError, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import { getClientIp, isRateLimited } from "../../lib/security";
import { sanitizeText } from "../../lib/sanitize";
import { createId, createScamWatchReport } from "../../lib/db";

const districts = [
  "Port Louis",
  "Pamplemousses",
  "Rivière du Rempart",
  "Flacq",
  "Grand Port",
  "Savanne",
  "Moka",
  "Plaines Wilhems",
  "Black River",
  "Rodrigues / Other",
] as const;

const schema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(15).max(1600),
  category: z.enum(["sms", "whatsapp", "call", "email", "social", "website", "other"]),
  district: z.enum(districts),
  platform: z.string().trim().min(2).max(80),
});

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`scam-watch:${getClientIp(event)}`, 6, 60 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: "rate_limited",
      message: "You have submitted several reports in a short time. Please try again later.",
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
      message: parsed.error.issues[0]?.message || "Please check the report and try again.",
    });
  }

  const { title, description, category, district, platform } = parsed.data;
  const report = createScamWatchReport({
    id: createId("sw"),
    title: sanitizeText(title, 120),
    description: sanitizeText(description, 1600),
    category,
    district,
    platform: sanitizeText(platform, 80),
  });

  return {
    id: report.id,
    title: report.title,
    category: report.category,
    district: report.district,
    status: report.status,
    createdAt: report.created_at,
  };
});
