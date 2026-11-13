export type Preset = "going_home" | "taking_the_bus" | "meeting_someone";
export type JourneyKind = "standard" | "child";
export type JourneyStatus = "on_the_way" | "arrived" | "overdue" | "cancelled";

export interface SharedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string | null;
}

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
  journeyKind: JourneyKind;
  locationEnabled: boolean;
  location: SharedLocation | null;
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
