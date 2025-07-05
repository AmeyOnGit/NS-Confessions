import { 
  messages, 
  comments, 
  likes, 
  rateLimits,
  type Message, 
  type Comment, 
  type Like,
  type RateLimit,
  type InsertMessage, 
  type InsertComment, 
  type InsertLike 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(limit?: number, offset?: number): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  likeMessage(messageId: number): Promise<Message>;
  
  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByMessageId(messageId: number): Promise<Comment[]>;
  
  // Likes
  createLike(like: InsertLike): Promise<Like>;
  hasUserLikedMessage(messageId: number, ipAddress: string): Promise<boolean>;
  
  // Rate limiting
  canUserPostMessage(ipAddress: string): Promise<boolean>;
  updateRateLimit(ipAddress: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private messages: Map<number, Message>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private rateLimits: Map<string, RateLimit>;
  private currentMessageId: number;
  private currentCommentId: number;
  private currentLikeId: number;
  private currentRateLimitId: number;

  constructor() {
    this.messages = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.rateLimits = new Map();
    this.currentMessageId = 1;
    this.currentCommentId = 1;
    this.currentLikeId = 1;
    this.currentRateLimitId = 1;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      content: insertMessage.content,
      ipAddress: insertMessage.ipAddress,
      createdAt: new Date(),
      likes: 0,
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(limit: number = 20, offset: number = 0): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
    return allMessages;
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async likeMessage(messageId: number): Promise<Message> {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    
    const updatedMessage = { ...message, likes: message.likes + 1 };
    this.messages.set(messageId, updatedMessage);
    return updatedMessage;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const comment: Comment = {
      id,
      messageId: insertComment.messageId,
      content: insertComment.content,
      isBot: insertComment.isBot || false,
      botName: insertComment.botName || null,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getCommentsByMessageId(messageId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.messageId === messageId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.currentLikeId++;
    const like: Like = {
      id,
      messageId: insertLike.messageId,
      ipAddress: insertLike.ipAddress,
    };
    this.likes.set(id, like);
    return like;
  }

  async hasUserLikedMessage(messageId: number, ipAddress: string): Promise<boolean> {
    return Array.from(this.likes.values())
      .some(like => like.messageId === messageId && like.ipAddress === ipAddress);
  }

  async canUserPostMessage(ipAddress: string): Promise<boolean> {
    const rateLimit = this.rateLimits.get(ipAddress);
    
    if (!rateLimit) {
      return true;
    }
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    return rateLimit.lastMessageTime < oneMinuteAgo;
  }

  async updateRateLimit(ipAddress: string): Promise<void> {
    const existing = this.rateLimits.get(ipAddress);
    
    if (existing) {
      const updated = { ...existing, lastMessageTime: new Date() };
      this.rateLimits.set(ipAddress, updated);
    } else {
      const id = this.currentRateLimitId++;
      const newRateLimit: RateLimit = {
        id,
        ipAddress,
        lastMessageTime: new Date(),
      };
      this.rateLimits.set(ipAddress, newRateLimit);
    }
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<any | undefined> {
    // This method is not used in the current implementation
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    // This method is not used in the current implementation
    return undefined;
  }

  async createUser(insertUser: any): Promise<any> {
    // This method is not used in the current implementation
    throw new Error("Not implemented");
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessages(limit: number = 20, offset: number = 0): Promise<Message[]> {
    const allMessages = await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
    
    return allMessages;
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message || undefined;
  }

  async likeMessage(messageId: number): Promise<Message> {
    // First get the current message
    const [currentMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
    
    if (!currentMessage) {
      throw new Error("Message not found");
    }
    
    // Update with incremented likes
    const [updatedMessage] = await db
      .update(messages)
      .set({ likes: currentMessage.likes + 1 })
      .where(eq(messages.id, messageId))
      .returning();
    
    return updatedMessage;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getCommentsByMessageId(messageId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.messageId, messageId))
      .orderBy((comments) => comments.createdAt);
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values(insertLike)
      .returning();
    return like;
  }

  async hasUserLikedMessage(messageId: number, ipAddress: string): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(
        eq(likes.messageId, messageId),
        eq(likes.ipAddress, ipAddress)
      ));
    
    return !!existingLike;
  }

  async canUserPostMessage(ipAddress: string): Promise<boolean> {
    const [rateLimit] = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.ipAddress, ipAddress));
    
    if (!rateLimit) {
      return true;
    }
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    return rateLimit.lastMessageTime < oneMinuteAgo;
  }

  async updateRateLimit(ipAddress: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.ipAddress, ipAddress));
    
    if (existing) {
      await db
        .update(rateLimits)
        .set({ lastMessageTime: new Date() })
        .where(eq(rateLimits.ipAddress, ipAddress));
    } else {
      await db
        .insert(rateLimits)
        .values({
          ipAddress,
          lastMessageTime: new Date(),
        });
    }
  }
}

export const storage = new DatabaseStorage();
