// Nume, culori si simboluri comune pentru harta, legenda, filtre si panoul de detalii.
import type { Doc } from "../convex/_generated/dataModel";

export type Place = Doc<"places">;

export type PlaceType = "library" | "cafe" | "coworking";

export const placeTypes: Record<PlaceType, { label: string; plural: string; color: string }> = {
  library: { label: "Bibliotecă", plural: "Biblioteci", color: "#2563eb" },
  cafe: { label: "Cafenea", plural: "Cafenele", color: "#c2410c" },
  coworking: { label: "Coworking", plural: "Coworking", color: "#059669" },
};

export const placeTypeKeys = Object.keys(placeTypes) as PlaceType[];

export type Criterion = "crowdedness" | "outlets" | "quietness" | "wifi" | "safety";

export const criteria: { key: Criterion; label: string; hint: string }[] = [
  { key: "crowdedness", label: "Aglomerare", hint: "5 = de obicei liber" },
  { key: "outlets", label: "Prize", hint: "5 = ușor de găsit" },
  { key: "quietness", label: "Liniște", hint: "5 = foarte liniștit" },
  { key: "wifi", label: "Wi-Fi", hint: "5 = rapid și stabil" },
  { key: "safety", label: "Siguranța zonei", hint: "5 = foarte sigur" },
];

export type Filters = {
  type: PlaceType | "all";
  minRatings: Record<Criterion, number>;
};

export const noFilters: Filters = {
  type: "all",
  minRatings: { crowdedness: 0, outlets: 0, quietness: 0, wifi: 0, safety: 0 },
};

// scorul general al unui loc = media celor 5 criterii (null daca nu are recenzii)
export function overallScore(place: Place) {
  if (place.reviewCount === 0) return null;
  const values = criteria.map((c) => place.avgRatings[c.key]);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export type LatLng = { lat: number; lng: number };
