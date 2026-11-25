import { query } from "./_generated/server";

const KEYS = ["crowdedness", "outlets", "quietness", "wifi", "safety"] as const;

// Statistici pentru dashboard: totaluri, medii pe criterii, locuri pe tip, top locuri.
export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const places = await ctx.db.query("places").take(1000);
    const totalReviews = places.reduce((s, p) => s + p.reviewCount, 0);

    const averages = { crowdedness: 0, outlets: 0, quietness: 0, wifi: 0, safety: 0 };
    if (totalReviews > 0) {
      for (const k of KEYS) {
        // medie ponderata cu numarul de recenzii al fiecarui loc
        const sum = places.reduce((s, p) => s + p.avgRatings[k] * p.reviewCount, 0);
        averages[k] = Math.round((sum / totalReviews) * 100) / 100;
      }
    }

    const placesByType = { library: 0, cafe: 0, coworking: 0 };
    for (const p of places) placesByType[p.type] += 1;

    const topPlaces = places
      .filter((p) => p.reviewCount > 0)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        type: p.type,
        reviewCount: p.reviewCount,
        overall: Math.round((KEYS.reduce((s, k) => s + p.avgRatings[k], 0) / KEYS.length) * 100) / 100,
      }))
      .sort((a, b) => b.overall - a.overall || b.reviewCount - a.reviewCount)
      .slice(0, 5);

    return { totalPlaces: places.length, totalReviews, averages, placesByType, topPlaces };
  },
});
