import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const ratings = v.object({
  crowdedness: v.number(),
  outlets: v.number(),
  quietness: v.number(),
  wifi: v.number(),
  safety: v.number(),
});

export default defineSchema({
  // username-ul si credentialele sunt gestionate de Convex Auth; aici doar campurile aplicatiei.
  users: defineTable({
    role: v.optional(v.union(v.literal("student"), v.literal("admin"))),
  }),

  places: defineTable({
    name: v.string(),
    type: v.union(v.literal("library"), v.literal("cafe"), v.literal("coworking")),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    description: v.string(),
    openingHours: v.string(),
    avgRatings: ratings,
    reviewCount: v.number(),
  }).index("by_type", ["type"]),

  reviews: defineTable({
    placeId: v.id("places"),
    userId: v.id("users"),
    ratings,
    comment: v.string(),
    createdAt: v.number(),
  })
    .index("by_place", ["placeId"])
    .index("by_user", ["userId"])
    .index("by_place_and_user", ["placeId", "userId"]),

  favorites: defineTable({
    userId: v.id("users"),
    placeId: v.id("places"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_place", ["placeId"])
    .index("by_user_and_place", ["userId", "placeId"]),
});
