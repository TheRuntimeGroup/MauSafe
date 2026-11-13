import { defineHandler } from "nitro";
import { setResponseHeader } from "nitro/h3";
import { listScamWatchReports } from "../../lib/db";

export default defineHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  return listScamWatchReports().map((report) => ({
    id: report.id,
    title: report.title,
    description: report.description,
    category: report.category,
    district: report.district,
    platform: report.platform,
    status: report.status,
    createdAt: report.created_at,
  }));
});
