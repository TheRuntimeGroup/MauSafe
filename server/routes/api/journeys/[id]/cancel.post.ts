import { defineHandler } from "nitro";
import { requireOwnerJourney } from "../../../../lib/guard";
import { cancelJourney, toOwnerView } from "../../../../lib/journey";

export default defineHandler((event) => {
  const row = requireOwnerJourney(event);
  const updated = cancelJourney(row.id);
  return { journey: toOwnerView(updated!) };
});
