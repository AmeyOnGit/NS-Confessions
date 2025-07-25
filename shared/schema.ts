import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  likes: integer("likes").default(0).notNull(),
  ipAddress: text("ip_address").notNull(),
  demoted: boolean("demoted").default(false).notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isBot: boolean("is_bot").default(false).notNull(),
  botName: text("bot_name"),
  likes: integer("likes").default(0).notNull(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  ipAddress: text("ip_address").notNull(),
  sessionId: text("session_id").notNull(),
});

export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull(),
  ipAddress: text("ip_address").notNull(),
  sessionId: text("session_id").notNull(),
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

export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({
  id: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
