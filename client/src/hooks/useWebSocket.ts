import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from '@shared/schema';

interface WebSocketMessage {
  type: 'message' | 'typing' | 'error' | 'auth';
  data?: Message;
  userId?: number;
  isTyping?: boolean;
  message?: string;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (content: string, senderId: number, receiverId: number) => void;
  sendTyping: (userId: number, isTyping: boolean) => void;
  messages: Message[];
  typingUsers: Set<number>;
  error: string | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        // Authenticate with user ID 1 (default user)
        ws.send(JSON.stringify({
          type: 'auth',
          userId: 1,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'message' && message.data) {
            setMessages(prev => [...prev, message.data!]);
          } else if (message.type === 'typing') {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              if (message.isTyping && message.userId) {
                newSet.add(message.userId);
              } else if (message.userId) {
                newSet.delete(message.userId);
              }
              return newSet;
            });
          } else if (message.type === 'error') {
            setError(message.message || 'WebSocket error');
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };

      setSocket(ws);
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError('Failed to connect');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content: string, senderId: number, receiverId: number) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'message',
        content,
        senderId,
        receiverId,
      }));
    }
  }, [socket]);

  const sendTyping = useCallback((userId: number, isTyping: boolean) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing',
        userId,
        isTyping,
      }));
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    sendMessage,
    sendTyping,
    messages,
    typingUsers,
    error,
  };
}
