import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const zero = { crowdedness: 0, outlets: 0, quietness: 0, wifi: 0, safety: 0 };

export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("places").collect(),
});

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export const nearest = query({
  args: { lat: v.number(), lng: v.number() },
  handler: async (ctx, { lat, lng }) => {
    const places = await ctx.db.query("places").collect();
    let best: { place: (typeof places)[number]; km: number } | null = null;
    for (const place of places) {
      const km = haversineKm(lat, lng, place.lat, place.lng);
      if (!best || km < best.km) best = { place, km };
    }
    return best;
  },
});

// Date de pornire pentru dezvoltare; de inlocuit cu locuri reale. Rulare: npx convex run places:seed
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
