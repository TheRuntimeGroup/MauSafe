export interface SafePlace {
  id: string;
  name: string;
  kind: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  openStreetMapUrl: string;
}
