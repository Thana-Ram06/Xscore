import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchesTable = pgTable("searches", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  score: real("score").notNull(),
  followers: integer("followers").notNull(),
  following: integer("following").notNull().default(0),
  tweets: integer("tweets").notNull().default(0),
  engagementRate: real("engagement_rate").notNull(),
  growthRate: real("growth_rate").notNull(),
  avgLikes: real("avg_likes").notNull().default(0),
  avgRetweets: real("avg_retweets").notNull().default(0),
  avgReplies: real("avg_replies").notNull().default(0),
  tier: text("tier").notNull(),
  userId: text("user_id"),
  userEmail: text("user_email"),
  searchedAt: timestamp("searched_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSearchSchema = createInsertSchema(searchesTable).omit({ id: true, searchedAt: true });
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searchesTable.$inferSelect;
