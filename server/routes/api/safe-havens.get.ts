import { defineHandler } from "nitro";
import { setResponseHeader } from "nitro/h3";
import { listApprovedSafeHavens } from "../../lib/db";

export default defineHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  return listApprovedSafeHavens().map((haven) => ({
    id: haven.id,
    name: haven.name,
    category: haven.category,
    description: haven.description,
    address: haven.address,
    latitude: haven.latitude,
    longitude: haven.longitude,
    status: haven.status,
    createdAt: haven.created_at,
  }));
});
