import { 
  messages, 
  comments, 
  likes, 
  commentLikes,
  rateLimits,
  type Message, 
  type Comment, 
  type Like,
  type CommentLike,
  type RateLimit,
  type InsertMessage, 
  type InsertComment, 
  type InsertLike,
  type InsertCommentLike
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(limit?: number, offset?: number, sortBy?: 'newest' | 'most_liked' | 'most_commented' | 'hottest'): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  likeMessage(messageId: number): Promise<Message>;
  deleteMessage(messageId: number): Promise<void>;
  demoteMessage(messageId: number): Promise<Message>;
  
  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByMessageId(messageId: number): Promise<Comment[]>;
  likeComment(commentId: number): Promise<Comment>;
  deleteComment(commentId: number): Promise<void>;
  
  // Likes
  createLike(like: InsertLike): Promise<Like>;
  hasUserLikedMessage(messageId: number, ipAddress: string): Promise<boolean>;
  createCommentLike(commentLike: InsertCommentLike): Promise<CommentLike>;
  hasUserLikedComment(commentId: number, ipAddress: string): Promise<boolean>;
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
      demoted: false,
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(limit: number = 20, offset: number = 0, sortBy: 'newest' | 'most_liked' | 'most_commented' | 'hottest' = 'newest'): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values());
    
    if (sortBy === 'most_liked') {
      allMessages.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'most_commented') {
      // Sort by comment count (count comments for each message)
      allMessages.sort((a, b) => {
        const aCommentCount = Array.from(this.comments.values()).filter(c => c.messageId === a.id).length;
        const bCommentCount = Array.from(this.comments.values()).filter(c => c.messageId === b.id).length;
        return bCommentCount - aCommentCount;
      });
    } else if (sortBy === 'hottest') {
      // Sort by most recent activity (newest message creation or comment addition)
      allMessages.sort((a, b) => {
        // Get the latest comment date for each message
        const aComments = Array.from(this.comments.values()).filter(c => c.messageId === a.id);
        const bComments = Array.from(this.comments.values()).filter(c => c.messageId === b.id);
        
        const aLatestComment = aComments.length > 0 ? Math.max(...aComments.map(c => c.createdAt.getTime())) : 0;
        const bLatestComment = bComments.length > 0 ? Math.max(...bComments.map(c => c.createdAt.getTime())) : 0;
        
        // For demoted messages, only use message creation time, not comment activity
        const aLatestActivity = a.demoted ? a.createdAt.getTime() : Math.max(a.createdAt.getTime(), aLatestComment);
        const bLatestActivity = b.demoted ? b.createdAt.getTime() : Math.max(b.createdAt.getTime(), bLatestComment);
        
        return bLatestActivity - aLatestActivity;
      });
    } else {
      allMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    return allMessages.slice(offset, offset + limit);
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

  async deleteMessage(messageId: number): Promise<void> {
    this.messages.delete(messageId);
    // Also delete associated comments and likes
    const commentsToDelete = Array.from(this.comments.keys()).filter(id => {
      const comment = this.comments.get(id);
      return comment?.messageId === messageId;
    });
    commentsToDelete.forEach(id => this.comments.delete(id));
    
    const likesToDelete = Array.from(this.likes.keys()).filter(id => {
      const like = this.likes.get(id);
      return like?.messageId === messageId;
    });
    likesToDelete.forEach(id => this.likes.delete(id));
  }

  async demoteMessage(messageId: number): Promise<Message> {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    
    const updatedMessage = { ...message, demoted: true };
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
      likes: 0,
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

  async likeComment(commentId: number): Promise<Comment> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    const updatedComment = { ...comment, likes: comment.likes + 1 };
    this.comments.set(commentId, updatedComment);
    return updatedComment;
  }

  async deleteComment(commentId: number): Promise<void> {
    this.comments.delete(commentId);
  }

  async createCommentLike(insertCommentLike: InsertCommentLike): Promise<CommentLike> {
    // For MemStorage, we'll create a simple implementation
    const id = this.currentLikeId++; // Reuse like ID counter
    const commentLike: CommentLike = {
      id,
      commentId: insertCommentLike.commentId,
      ipAddress: insertCommentLike.ipAddress,
    };
    return commentLike;
  }

  async hasUserLikedComment(commentId: number, ipAddress: string): Promise<boolean> {
    // For MemStorage, we'll always return false for simplicity
    return false;
  }

  // Rate limiting functionality removed per user request
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

  async getMessages(limit: number = 20, offset: number = 0, sortBy: 'newest' | 'most_liked' | 'most_commented' | 'hottest' = 'newest'): Promise<Message[]> {
    if (sortBy === 'most_commented') {
      // Use a subquery to count comments per message and sort by that count
      const messagesWithCommentCount = await db
        .select({
          id: messages.id,
          content: messages.content,
          ipAddress: messages.ipAddress,
          createdAt: messages.createdAt,
          likes: messages.likes,
          demoted: messages.demoted,
          commentCount: sql<number>`COALESCE(${sql`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.messageId} = ${messages.id})`}, 0)`
        })
        .from(messages)
        .orderBy(desc(sql<number>`COALESCE(${sql`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.messageId} = ${messages.id})`}, 0)`))
        .limit(limit)
        .offset(offset);
      
      return messagesWithCommentCount;
    } else if (sortBy === 'hottest') {
      // Sort by most recent activity (message creation or latest comment)
      const messagesWithLatestActivity = await db
        .select({
          id: messages.id,
          content: messages.content,
          ipAddress: messages.ipAddress,
          createdAt: messages.createdAt,
          likes: messages.likes,
          demoted: messages.demoted,
          latestActivity: sql<Date>`CASE 
            WHEN ${messages.demoted} = true THEN ${messages.createdAt}
            ELSE GREATEST(
              ${messages.createdAt},
              COALESCE((SELECT MAX(${comments.createdAt}) FROM ${comments} WHERE ${comments.messageId} = ${messages.id}), ${messages.createdAt})
            )
          END`
        })
        .from(messages)
        .orderBy(desc(sql<Date>`GREATEST(
          ${messages.createdAt},
          COALESCE((SELECT MAX(${comments.createdAt}) FROM ${comments} WHERE ${comments.messageId} = ${messages.id}), ${messages.createdAt})
        )`))
        .limit(limit)
        .offset(offset);
      
      return messagesWithLatestActivity;
    } else {
      const orderBy = sortBy === 'most_liked' ? desc(messages.likes) : desc(messages.createdAt);
      
      const allMessages = await db
        .select()
        .from(messages)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);
      
      return allMessages;
    }
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

  async likeComment(commentId: number): Promise<Comment> {
    // First get the current comment
    const [currentComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));
    
    if (!currentComment) {
      throw new Error("Comment not found");
    }
    
    // Update with incremented likes
    const [updatedComment] = await db
      .update(comments)
      .set({ likes: currentComment.likes + 1 })
      .where(eq(comments.id, commentId))
      .returning();
    
    return updatedComment;
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

  async createCommentLike(insertCommentLike: InsertCommentLike): Promise<CommentLike> {
    const [commentLike] = await db
      .insert(commentLikes)
      .values(insertCommentLike)
      .returning();
    return commentLike;
  }

  async hasUserLikedComment(commentId: number, ipAddress: string): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.ipAddress, ipAddress)
      ));
    
    return !!existingLike;
  }

  async deleteMessage(messageId: number): Promise<void> {
    // Delete associated comments first
    await db.delete(comments).where(eq(comments.messageId, messageId));
    
    // Delete associated likes
    await db.delete(likes).where(eq(likes.messageId, messageId));
    
    // Delete the message
    await db.delete(messages).where(eq(messages.id, messageId));
  }

  async demoteMessage(messageId: number): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ demoted: true })
      .where(eq(messages.id, messageId))
      .returning();
    
    if (!updatedMessage) {
      throw new Error("Message not found");
    }
    
    return updatedMessage;
  }

  async deleteComment(commentId: number): Promise<void> {
    // Delete associated comment likes first
    await db.delete(commentLikes).where(eq(commentLikes.commentId, commentId));
    
    // Delete the comment
    await db.delete(comments).where(eq(comments.id, commentId));
  }

  // Rate limiting functionality removed per user request
}

export const storage = new DatabaseStorage();
