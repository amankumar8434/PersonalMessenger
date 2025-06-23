import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";

interface WebSocketWithUserId extends WebSocket {
  userId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get messages between two users
  app.get("/api/messages/:userId1/:userId2", async (req, res) => {
    try {
      const userId1 = parseInt(req.params.userId1);
      const userId2 = parseInt(req.params.userId2);
      
      if (isNaN(userId1) || isNaN(userId2)) {
        return res.status(400).json({ error: "Invalid user IDs" });
      }
      
      const messages = await storage.getMessages(userId1, userId2);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocketWithUserId) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          ws.userId = message.userId;
          console.log(`User ${message.userId} authenticated`);
          return;
        }
        
        if (message.type === 'message') {
          try {
            // Validate message data
            const validatedMessage = insertMessageSchema.parse({
              content: message.content,
              senderId: message.senderId,
              receiverId: message.receiverId,
            });
            
            // Store message
            const savedMessage = await storage.createMessage(validatedMessage);
            
            // Broadcast message to all connected clients
            wss.clients.forEach((client: WebSocketWithUserId) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'message',
                  data: savedMessage,
                }));
              }
            });
          } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to save message'
            }));
          }
        }
        
        if (message.type === 'typing') {
          // Broadcast typing indicator to other users
          wss.clients.forEach((client: WebSocketWithUserId) => {
            if (client.readyState === WebSocket.OPEN && client.userId !== ws.userId) {
              client.send(JSON.stringify({
                type: 'typing',
                userId: ws.userId,
                isTyping: message.isTyping,
              }));
            }
          });
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
