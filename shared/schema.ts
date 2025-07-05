import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  likes: integer("likes").default(0).notNull(),
  ipAddress: text("ip_address").notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isBot: boolean("is_bot").default(false).notNull(),
  botName: text("bot_name"),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  ipAddress: text("ip_address").notNull(),
});

export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  lastMessageTime: timestamp("last_message_time").notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  likes: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
