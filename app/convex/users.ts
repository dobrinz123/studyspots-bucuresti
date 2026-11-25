import { internalMutation, query, type QueryCtx } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createUser = internalMutation({
  args: {
    method: v.object({ name: v.literal("usernamePasskey"), profile: v.object({}) }),
  },
  returns: v.id("users"),
  handler: async (ctx) => {
    return await ctx.db.insert("users", { role: "student" });
  },
});

// Utilizatorul curent (sau null daca nu e autentificat).
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get("users", userId);
    if (user === null) return null;
    const username = await ctx.runQuery(components.authUsername.public.getUsername, { userId });
    return { _id: userId, username, role: user.role ?? "student" };
  },
});

// Utilizator autentificat obligatoriu; intoarce id-ul lui.
export async function requireUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Neautentificat");
  return userId;
}

// Folosit de functiile de admin (ex. places.create/update/remove): arunca eroare daca nu e admin.
export async function requireAdmin(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Neautentificat");
  const user = await ctx.db.get("users", userId);
  if (user?.role !== "admin") throw new Error("Doar adminul poate face asta");
  return userId;
}
