import { defineHandler } from "nitro";
import { createError, getRouterParam, setResponseHeader } from "nitro/h3";
import { getAnonymousReportByToken } from "../../lib/db";

export default defineHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const token = (getRouterParam(event, "token") || "").toUpperCase();
  const report = getAnonymousReportByToken(token);
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: "not_found", message: "No report was found with that tracking code." });
  }
  return {
    id: report.id,
    token: report.token,
    category: report.category,
    title: report.title,
    description: report.description,
    district: report.district,
    status: report.status,
    resolution: report.resolution,
    resolvedAt: report.resolved_at,
    createdAt: report.created_at,
  };
});
