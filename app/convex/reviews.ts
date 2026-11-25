import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./users";

export const ratingsValidator = v.object({
  crowdedness: v.number(), // cat de aglomerat e de obicei (5 = linistit/liber)
  outlets: v.number(),
  quietness: v.number(),
  wifi: v.number(),
  safety: v.number(),
});

const KEYS = ["crowdedness", "outlets", "quietness", "wifi", "safety"] as const;

function validate(ratings: Record<(typeof KEYS)[number], number>) {
  for (const k of KEYS) {
    const x = ratings[k];
    if (!Number.isInteger(x) || x < 1 || x > 5) throw new Error(`Rating invalid pentru ${k} (1-5)`);
  }
}

// Adauga recenzia utilizatorului pentru un loc (daca exista deja una, o inlocuieste) si recalculeaza mediile.
export const add = mutation({
  args: { placeId: v.id("places"), ratings: ratingsValidator, comment: v.string() },
  handler: async (ctx, { placeId, ratings, comment }) => {
    const userId = await requireUser(ctx);
    validate(ratings);
    if (comment.length > 2000) throw new Error("Comentariu prea lung");
    if ((await ctx.db.get("places", placeId)) === null) throw new Error("Loc inexistent");

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_place_and_user", (q) => q.eq("placeId", placeId).eq("userId", userId))
      .first();
    const doc = { placeId, userId, ratings, comment, createdAt: Date.now() };
    let id;
    if (existing) {
      await ctx.db.replace("reviews", existing._id, doc);
      id = existing._id;
    } else {
      id = await ctx.db.insert("reviews", doc);
    }

    const all = await ctx.db.query("reviews").withIndex("by_place", (q) => q.eq("placeId", placeId)).take(1000);
    const avg = { crowdedness: 0, outlets: 0, quietness: 0, wifi: 0, safety: 0 };
    for (const k of KEYS) {
      avg[k] = Math.round((all.reduce((s, r) => s + r.ratings[k], 0) / all.length) * 100) / 100;
    }
    await ctx.db.patch("places", placeId, { avgRatings: avg, reviewCount: all.length });
    return id;
  },
});

export const byPlace = query({
  args: { placeId: v.id("places") },
  handler: (ctx, { placeId }) =>
    ctx.db.query("reviews").withIndex("by_place", (q) => q.eq("placeId", placeId)).order("desc").take(100),
});
