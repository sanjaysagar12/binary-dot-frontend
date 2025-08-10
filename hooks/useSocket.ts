'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  userId?: string;
  token?: string;
}

interface SocketEvents {
  newMessage: (message: any) => void;
  messageNotification: (notification: any) => void;
  userTyping: (data: { userId: string; chatId: string }) => void;
  userStoppedTyping: (data: { userId: string; chatId: string }) => void;
  userOnline: (data: { userId: string }) => void;
  userOffline: (data: { userId: string }) => void;
  joinedChat: (data: { chatId: string }) => void;
}

export const useSocket = ({ userId, token }: UseSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const eventHandlers = useRef<Partial<SocketEvents>>({});

  useEffect(() => {
    if (!userId || !token) return;

    // Initialize socket connection
    const newSocket = io('http://localhost:3000/chat', {
      auth: {
        token,
        userId
      },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    // User status events
    newSocket.on('userOnline', (data: { userId: string }) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
      eventHandlers.current.userOnline?.(data);
    });

    newSocket.on('userOffline', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      eventHandlers.current.userOffline?.(data);
    });

    // Chat events
    newSocket.on('newMessage', (message: any) => {
      eventHandlers.current.newMessage?.(message);
    });

    newSocket.on('messageNotification', (notification: any) => {
      eventHandlers.current.messageNotification?.(notification);
    });

    newSocket.on('userTyping', (data: { userId: string; chatId: string }) => {
      eventHandlers.current.userTyping?.(data);
    });

    newSocket.on('userStoppedTyping', (data: { userId: string; chatId: string }) => {
      eventHandlers.current.userStoppedTyping?.(data);
    });

    newSocket.on('joinedChat', (data: { chatId: string }) => {
      eventHandlers.current.joinedChat?.(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId, token]);

  const joinChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('joinChat', { chatId });
    }
  };

  const sendMessage = (data: {
    chatId: string;
    receiverId: string;
    content: string;
    image?: string;
  }) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', data);
    }
  };

  const startTyping = (chatId: string, receiverId: string) => {
    if (socket && isConnected) {
      socket.emit('typing', { chatId, receiverId });
    }
  };

  const stopTyping = (chatId: string, receiverId: string) => {
    if (socket && isConnected) {
      socket.emit('stopTyping', { chatId, receiverId });
    }
  };

  const on = <K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) => {
    eventHandlers.current[event] = handler;
  };

  const off = <K extends keyof SocketEvents>(event: K) => {
    delete eventHandlers.current[event];
  };

  return {
    socket,
    isConnected,
    onlineUsers,
    joinChat,
    sendMessage,
    startTyping,
    stopTyping,
    on,
    off
  };
};