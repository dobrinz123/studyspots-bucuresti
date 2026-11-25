import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireUser } from "./users";

// Adauga la favorite daca nu e, altfel il scoate. Intoarce starea noua.
export const toggle = mutation({
  args: { placeId: v.id("places") },
  handler: async (ctx, { placeId }) => {
    const userId = await requireUser(ctx);
    if ((await ctx.db.get("places", placeId)) === null) throw new Error("Loc inexistent");
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_place", (q) => q.eq("userId", userId).eq("placeId", placeId))
      .first();
    if (existing) {
      await ctx.db.delete("favorites", existing._id);
      return { favorite: false };
    }
    await ctx.db.insert("favorites", { userId, placeId, createdAt: Date.now() });
    return { favorite: true };
  },
});

// Locurile favorite ale utilizatorului curent (lista goala daca nu e autentificat).
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const favs = await ctx.db.query("favorites").withIndex("by_user", (q) => q.eq("userId", userId)).take(500);
    const places = await Promise.all(favs.map((f) => ctx.db.get("places", f.placeId)));
    return places.filter((p) => p !== null);
  },
});
