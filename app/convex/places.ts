import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

const MAX_PLACES = 1000;

export const placeType = v.union(v.literal("library"), v.literal("cafe"), v.literal("coworking"));

const zero = { crowdedness: 0, outlets: 0, quietness: 0, wifi: 0, safety: 0 };

const criteriaMin = v.object({
  crowdedness: v.optional(v.number()),
  outlets: v.optional(v.number()),
  quietness: v.optional(v.number()),
  wifi: v.optional(v.number()),
  safety: v.optional(v.number()),
});

function checkCoords(lat: number, lng: number) {
  if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) throw new Error("Coordonate invalide");
}

export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("places").take(MAX_PLACES),
});

// Lista ca GeoJSON FeatureCollection (puncte), compatibila cu ArcGIS.
export const listGeoJson = query({
  args: {},
  handler: async (ctx) => {
    const places = await ctx.db.query("places").take(MAX_PLACES);
    return {
      type: "FeatureCollection" as const,
      features: places.map((p) => ({
        type: "Feature" as const,
        id: p._id,
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
        properties: {
          name: p.name,
          type: p.type,
          address: p.address,
          description: p.description,
          openingHours: p.openingHours,
          reviewCount: p.reviewCount,
          ...p.avgRatings,
        },
      })),
    };
  },
});

export const get = query({
  args: { placeId: v.id("places") },
  handler: (ctx, { placeId }) => ctx.db.get("places", placeId),
});

// Filtrare dupa tip si rating minim pe criterii (ex. quietness >= 4).
export const filter = query({
  args: { type: v.optional(placeType), minRatings: v.optional(criteriaMin) },
  handler: async (ctx, { type, minRatings }) => {
    const places =
      type === undefined
        ? await ctx.db.query("places").take(MAX_PLACES)
        : await ctx.db.query("places").withIndex("by_type", (q) => q.eq("type", type)).take(MAX_PLACES);
    if (!minRatings) return places;
    const mins = Object.entries(minRatings) as [keyof typeof zero, number | undefined][];
    return places.filter((p) => mins.every(([k, min]) => min === undefined || p.avgRatings[k] >= min));
  },
});

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

// Cele mai apropiate `limit` locuri (implicit 1), sortate dupa distanta in km. Optional, doar de un anumit tip.
export const nearest = query({
  args: { lat: v.number(), lng: v.number(), limit: v.optional(v.number()), type: v.optional(placeType) },
  handler: async (ctx, { lat, lng, limit, type }) => {
    checkCoords(lat, lng);
    const places =
      type === undefined
        ? await ctx.db.query("places").take(MAX_PLACES)
        : await ctx.db.query("places").withIndex("by_type", (q) => q.eq("type", type)).take(MAX_PLACES);
    return places
      .map((place) => ({ place, km: haversineKm(lat, lng, place.lat, place.lng) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, Math.max(1, Math.min(limit ?? 1, 20)));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: placeType,
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    description: v.optional(v.string()),
    openingHours: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    checkCoords(args.lat, args.lng);
    if (args.name.trim() === "") throw new Error("Numele e obligatoriu");
    return await ctx.db.insert("places", {
      ...args,
      name: args.name.trim(),
      description: args.description ?? "",
      openingHours: args.openingHours ?? "",
      avgRatings: zero,
      reviewCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    placeId: v.id("places"),
    name: v.optional(v.string()),
    type: v.optional(placeType),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    description: v.optional(v.string()),
    openingHours: v.optional(v.string()),
  },
  handler: async (ctx, { placeId, ...fields }) => {
    await requireAdmin(ctx);
    const place = await ctx.db.get("places", placeId);
    if (place === null) throw new Error("Loc inexistent");
    checkCoords(fields.lat ?? place.lat, fields.lng ?? place.lng);
    await ctx.db.patch("places", placeId, fields);
  },
});

// Sterge locul si recenziile/favoritele lui (maxim 500 din fiecare per apel).
export const remove = mutation({
  args: { placeId: v.id("places") },
  handler: async (ctx, { placeId }) => {
    await requireAdmin(ctx);
    if ((await ctx.db.get("places", placeId)) === null) throw new Error("Loc inexistent");
    for (const r of await ctx.db.query("reviews").withIndex("by_place", (q) => q.eq("placeId", placeId)).take(500)) {
      await ctx.db.delete("reviews", r._id);
    }
    for (const f of await ctx.db.query("favorites").withIndex("by_place", (q) => q.eq("placeId", placeId)).take(500)) {
      await ctx.db.delete("favorites", f._id);
    }
    await ctx.db.delete("places", placeId);
  },
});

// Date de pornire pentru dezvoltare. Rulare: npx convex run places:seed
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    if ((await ctx.db.query("places").first()) !== null) return "deja populat";
    const base = { avgRatings: zero, reviewCount: 0, openingHours: "", description: "" };
    await ctx.db.insert("places", { ...base, name: "Biblioteca Centrala Universitara", type: "library", address: "Str. Boteanu 1", lat: 44.4357, lng: 26.0997 });
    await ctx.db.insert("places", { ...base, name: "Cafenea exemplu", type: "cafe", address: "Centrul Vechi", lat: 44.4313, lng: 26.1022 });
    await ctx.db.insert("places", { ...base, name: "Coworking exemplu", type: "coworking", address: "Piata Victoriei", lat: 44.4523, lng: 26.0865 });
    return "ok";
  },
});
