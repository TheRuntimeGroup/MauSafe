import { createError, getRouterParam, type H3Event } from "nitro/h3";
import { getJourneyById, type JourneyRow } from "./journey";
import { getBearer, sha256 } from "./security";

/** Loads the journey from the URL and verifies the caller is its owner. */
export function requireOwnerJourney(event: H3Event): JourneyRow {
  const id = getRouterParam(event, "id");
  const row = id ? getJourneyById(id) : null;
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "not_found" });
  }

  const secret = getBearer(event);
  if (!secret || row.owner_secret_hash !== sha256(secret)) {
    throw createError({ statusCode: 403, statusMessage: "unauthorized" });
  }

  return row;
}
