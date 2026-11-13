import { defineHandler } from "nitro";
import { requireOwnerJourney } from "../../../../lib/guard";
import { revokeJourney, toOwnerView } from "../../../../lib/journey";

export default defineHandler((event) => {
  const row = requireOwnerJourney(event);
  const updated = revokeJourney(row.id);
  return { journey: toOwnerView(updated!) };
});
