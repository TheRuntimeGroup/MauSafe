import { defineHandler } from "nitro";
import { requireOwnerJourney } from "../../../../lib/guard";
import { disableJourneyLocation, toOwnerView } from "../../../../lib/journey";

export default defineHandler((event) => {
  const row = requireOwnerJourney(event);
  const updated = disableJourneyLocation(row.id);
  return { journey: toOwnerView(updated!) };
});
