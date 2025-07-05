import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMessageSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";
// AI bot functionality removed per user request

const PASSWORD = "darktalent2024!";

interface WebSocketClient extends WebSocket {
  isAlive?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocketClient>();
  
  wss.on('connection', (ws: WebSocketClient) => {
    console.log('New WebSocket connection');
    ws.isAlive = true;
    clients.add(ws);
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    ws.on('close', () => {
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Heartbeat to keep connections alive
  setInterval(() => {
    clients.forEach((ws) => {
      if (!ws.isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  // Broadcast to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  // AI bot functionality removed per user request
  
  // Get client IP address
  function getClientIP(req: any): string {
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  }
  
  // Authentication middleware
  app.use('/api/auth', (req, res, next) => {
    const { password } = req.body;
    if (password !== PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    next();
  });
  
  // Password verification
  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });
  
  // Get messages with comments
  app.get('/api/messages', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const sortBy = (req.query.sortBy as 'newest' | 'most_liked' | 'most_commented') || 'newest';
      
      const messages = await storage.getMessages(limit, offset, sortBy);
      
      // Get comments for each message
      const messagesWithComments = await Promise.all(
        messages.map(async (message) => {
          const comments = await storage.getCommentsByMessageId(message.id);
          return {
            ...message,
            comments,
            commentCount: comments.length
          };
        })
      );
      
      res.json(messagesWithComments);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });
  
  // Create new message
  app.post('/api/messages', async (req, res) => {
    try {
      const ipAddress = getClientIP(req);
      
      // Validate input
      const result = insertMessageSchema.safeParse({
        content: req.body.content,
        ipAddress
      });
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid message content' });
      }
      
      // Sanitize content (basic cleaning)
      const sanitizedContent = result.data.content.trim();
      
      if (sanitizedContent.length === 0 || sanitizedContent.length > 500) {
        return res.status(400).json({ error: 'Message must be between 1 and 500 characters' });
      }
      
      // Create message
      const message = await storage.createMessage({
        content: sanitizedContent,
        ipAddress
      });
      
      // Broadcast new message to all clients
      broadcast({
        type: 'new_message',
        message: {
          ...message,
          comments: [],
          commentCount: 0
        }
      });
      
      res.json({
        ...message,
        comments: [],
        commentCount: 0
      });
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });
  
  // Like a message
  app.post('/api/messages/:id/like', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const ipAddress = getClientIP(req);
      
      // Check if user already liked this message
      const hasLiked = await storage.hasUserLikedMessage(messageId, ipAddress);
      if (hasLiked) {
        return res.status(400).json({ error: "You've already liked this message." });
      }
      
      // Create like record
      await storage.createLike({ messageId, ipAddress });
      
      // Update message like count
      const updatedMessage = await storage.likeMessage(messageId);
      
      // Broadcast like update to all clients
      broadcast({
        type: 'message_liked',
        messageId,
        likes: updatedMessage.likes
      });
      
      res.json(updatedMessage);
    } catch (error) {
      console.error('Error liking message:', error);
      res.status(500).json({ error: 'Failed to like message' });
    }
  });
  
  // Add comment to message
  app.post('/api/messages/:id/comments', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const ipAddress = getClientIP(req);
      
      // Validate input
      const result = insertCommentSchema.safeParse({
        messageId,
        content: req.body.content,
        isBot: false
      });
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid comment content' });
      }
      
      // Sanitize content
      const sanitizedContent = result.data.content.trim();
      
      if (sanitizedContent.length === 0 || sanitizedContent.length > 500) {
        return res.status(400).json({ error: 'Comment must be between 1 and 500 characters' });
      }
      
      // Create comment
      const comment = await storage.createComment({
        messageId,
        content: sanitizedContent,
        isBot: false
      });
      
      // Broadcast new comment to all clients
      broadcast({
        type: 'new_comment',
        comment
      });
      
      res.json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });
  
  // Get comments for a message
  app.get('/api/messages/:id/comments', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const comments = await storage.getCommentsByMessageId(messageId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  // Like a comment
  app.post('/api/comments/:id/like', async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const ipAddress = getClientIP(req);
      
      // Check if user already liked this comment
      const hasLiked = await storage.hasUserLikedComment(commentId, ipAddress);
      if (hasLiked) {
        return res.status(400).json({ error: "You've already liked this comment." });
      }
      
      // Create like record
      await storage.createCommentLike({
        commentId,
        ipAddress
      });
      
      // Update comment likes count
      const updatedComment = await storage.likeComment(commentId);
      
      // Broadcast comment like update to all clients
      broadcast({
        type: 'comment_liked',
        commentId,
        likes: updatedComment.likes
      });
      
      res.json(updatedComment);
    } catch (error) {
      console.error('Error liking comment:', error);
      res.status(500).json({ error: 'Failed to like comment' });
    }
  });

  return httpServer;
}
