import { defineHandler } from "nitro";
import { createError, getRouterParam, setResponseHeader } from "nitro/h3";
import { expireStaleWalkMates, getWalkMateByToken, listParticipants } from "../../lib/db";

export default defineHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  expireStaleWalkMates();
  const token = (getRouterParam(event, "token") || "").toUpperCase();
  const journey = getWalkMateByToken(token);
  if (!journey) {
    throw createError({ statusCode: 404, statusMessage: "not_found", message: "No walk was found with that code." });
  }
  const participants = listParticipants(journey.token).map((participant) => ({
    id: participant.id,
    name: participant.name,
    role: participant.role,
    latitude: participant.latitude,
    longitude: participant.longitude,
    accuracy: participant.accuracy,
    updatedAt: participant.updated_at,
  }));

  return {
    token: journey.token,
    ownerName: journey.owner_name,
    status: journey.status,
    createdAt: journey.created_at,
    updatedAt: journey.updated_at,
    participants,
  };
});
