import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { requireOwnerJourney } from "../../../../lib/guard";
import { extendJourney, toOwnerView } from "../../../../lib/journey";

export default defineHandler(async (event) => {
  const row = requireOwnerJourney(event);

  const body = (await readBody(event).catch(() => null)) as Record<string, unknown> | null;
  const minutes = Number(body?.additionalMinutes);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
    throw createError({ statusCode: 400, statusMessage: "invalid_minutes" });
  }

  const updated = extendJourney(row.id, minutes);
  return { journey: toOwnerView(updated!) };
});
