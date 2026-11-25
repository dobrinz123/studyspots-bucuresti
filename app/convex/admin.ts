import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Rulare din terminal (id-ul apare in dashboard, tabelul users):
//   npx convex run admin:makeAdmin '{"userId":"<id>"}'
export const makeAdmin = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch("users", userId, { role: "admin" });
  },
});
