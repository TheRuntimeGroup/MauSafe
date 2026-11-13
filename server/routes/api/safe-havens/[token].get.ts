import { defineHandler } from "nitro";
import { createError, getRouterParam, setResponseHeader } from "nitro/h3";
import { getSafeHavenByToken } from "../../lib/db";

export default defineHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const token = (getRouterParam(event, "token") || "").toUpperCase();
  const haven = getSafeHavenByToken(token);
  if (!haven) {
    throw createError({ statusCode: 404, statusMessage: "not_found", message: "No safe haven was found with that tracking code." });
  }
  return {
    id: haven.id,
    token: haven.token,
    name: haven.name,
    category: haven.category,
    address: haven.address,
    status: haven.status,
    createdAt: haven.created_at,
  };
});
