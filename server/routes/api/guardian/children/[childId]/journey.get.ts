import { defineHandler } from "nitro";
import { getRouterParam } from "nitro/h3";
import { getDb, type JourneyRow } from "../../../lib/db";
import { toOwnerView } from "../../../lib/journey";
import { requireSupabaseUser, requireChildLink } from "../../../lib/guardianAuth";

export function latestJourneyByChild(childAuthId: string): JourneyRow | null {
  return getDb()
    .prepare("SELECT * FROM journeys WHERE child_auth_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(childAuthId) as JourneyRow | undefined ?? null;
}

export default defineHandler(async (event) => {
  const guardian = await requireSupabaseUser(event);
  const childAuthId = getRouterParam(event, "childId") ?? "";
  const child = await requireChildLink(childAuthId, guardian.id);
  const journey = latestJourneyByChild(childAuthId);
  return {
    child: { name: child.child_name, email: child.child_email },
    journey: journey ? toOwnerView(journey) : null,
  };
});
