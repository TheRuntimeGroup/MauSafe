import { defineHandler } from "nitro";
import { setResponseHeader } from "nitro/h3";
import { listResolvedReports } from "../../lib/db";

export default defineHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  return listResolvedReports().map((report) => ({
    id: report.id,
    category: report.category,
    title: report.title,
    description: report.description,
    district: report.district,
    resolution: report.resolution,
    resolvedAt: report.resolved_at,
  }));
});
