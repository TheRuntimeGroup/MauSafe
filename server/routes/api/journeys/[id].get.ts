import { defineHandler } from "nitro";
import { requireOwnerJourney } from "../../../lib/guard";
import { toOwnerView } from "../../../lib/journey";

export default defineHandler((event) => {
  const row = requireOwnerJourney(event);
  return { journey: toOwnerView(row) };
});
