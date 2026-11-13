export type Preset = "going_home" | "taking_the_bus" | "meeting_someone";
export type JourneyStatus = "on_the_way" | "arrived" | "overdue" | "cancelled";

export interface GuestJourney {
  status: JourneyStatus;
  senderName: string;
  preset: Preset;
  label: string;
  expectedArrivalAt: string;
  createdAt: string;
  lastStatusAt: string;
  isDemo: boolean;
  expiresAt: string;
  revoked: boolean;
}

export interface OwnerJourney extends GuestJourney {
  id: string;
  contact: string;
  extendedCount: number;
  arrivedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  guestToken: string;
  guestExpiresAt: string;
  guestRevokedAt: string | null;
  sharePath: string;
  recipientSees: GuestJourney;
}
