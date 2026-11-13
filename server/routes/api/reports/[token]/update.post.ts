import { defineHandler } from "nitro";
import { createError, getRouterParam, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import { getClientIp, isRateLimited } from "../../lib/security";
import { sanitizeText } from "../../lib/sanitize";
import { getAnonymousReportByToken, updateAnonymousReport } from "../../lib/db";

const schema = z.object({
  note: z.string().trim().min(10).max(1200),
  resolved: z.boolean().optional(),
});

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`report-update:${getClientIp(event)}`, 10, 60 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: "rate_limited",
      message: "Too many updates in a short time. Please try again later.",
    });
  }

  const token = (getRouterParam(event, "token") || "").toUpperCase();
  const existing = getAnonymousReportByToken(token);
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "not_found", message: "No report was found with that tracking code." });
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
      message: parsed.error.issues[0]?.message || "Please check the update and try again.",
    });
  }

  const { note, resolved } = parsed.data;
  const report = updateAnonymousReport(token, {
    status: resolved ? "resolved" : "in_progress",
    resolution: note,
  });

  if (!report) {
    throw createError({ statusCode: 404, statusMessage: "not_found", message: "No report was found with that tracking code." });
  }

  return {
    id: report.id,
    token: report.token,
    status: report.status,
    resolution: report.resolution,
    resolvedAt: report.resolved_at,
    createdAt: report.created_at,
  };
});
