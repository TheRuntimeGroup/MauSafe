import { defineHandler } from "nitro";
import { requireOwnerJourney } from "../../../../lib/guard";
import { markArrived, toOwnerView } from "../../../../lib/journey";

export default defineHandler((event) => {
  const row = requireOwnerJourney(event);
  const updated = markArrived(row.id);
  return { journey: toOwnerView(updated!) };
});
