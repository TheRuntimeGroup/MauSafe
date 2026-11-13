import { defineHandler } from "nitro";
import { createError, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import { getClientIp, isRateLimited } from "../../lib/security";
import { sanitizeText } from "../../lib/sanitize";
import { createAnonymousReport, createCode, createId } from "../../lib/db";

const categories = [
  "scam",
  "fraud",
  "cybercrime",
  "harassment",
  "domestic_violence",
  "corruption",
  "other",
] as const;

const schema = z.object({
  category: z.enum(categories),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(2500),
  district: z.string().trim().min(2).max(80),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you understand this is an anonymous report." }),
  }),
});

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`report:${getClientIp(event)}`, 5, 60 * 60 * 1000)) {
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

  const { category, title, description, district } = parsed.data;
  const token = createCode(8);
  const report = createAnonymousReport({
    id: createId("ar"),
    token,
    category,
    title: sanitizeText(title, 120),
    description: sanitizeText(description, 2500),
    district: sanitizeText(district, 80),
  });

  return {
    id: report.id,
    token,
    status: report.status,
    createdAt: report.created_at,
    message:
      "Your anonymous report was recorded. Save this tracking code—it is the only way to check the status later.",
  };
});
