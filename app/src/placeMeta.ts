// Nume, culori si simboluri comune pentru harta, legenda, filtre si panoul de detalii.

export type PlaceType = "library" | "cafe" | "coworking";

export const placeTypes: Record<PlaceType, { label: string; color: string; marker: "circle" | "square" | "diamond" }> = {
  library: { label: "Bibliotecă", color: "#2563eb", marker: "circle" },
  cafe: { label: "Cafenea", color: "#b45309", marker: "square" },
  coworking: { label: "Coworking", color: "#059669", marker: "diamond" },
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
