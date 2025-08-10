'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSocket } from '@/hooks/useSocket';
import { 
  MessageCircle, 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon,
  Paperclip,
  Smile,
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  Wifi,
  WifiOff
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface Event {
  id: string;
  title: string;
  image?: string;
  creator: User;
}

interface Message {
  id: string;
  content: string;
  image?: string;
  isRead: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
}

interface Chat {
  chatId: string;
  event: Event;
  participants: Array<{
    user: User;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    sender: User;
    createdAt: string;
  };
  unreadCount: number;
  joinedAt: string;
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock current user - replace with actual auth context
  const currentUserId = 'current_user';
  const [authToken, setAuthToken] = useState<string>('');

  // Initialize WebSocket connection only after mount
  const {
    socket,
    isConnected,
    onlineUsers,
    joinChat,
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
    on,
    off
  } = useSocket({ 
    userId: mounted ? currentUserId : undefined, 
    token: mounted ? authToken : undefined 
  });

  // Set mounted state and get auth token on client side only
  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
    setAuthToken(token);
  }, []);

  // Get chatId from URL params if provided
  useEffect(() => {
    if (mounted && chats.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const chatIdFromUrl = urlParams.get('chatId');
      
      if (chatIdFromUrl) {
        const targetChat = chats.find(chat => chat.chatId === chatIdFromUrl);
        if (targetChat) {
          handleChatSelect(targetChat);
        }
      }
    }
  }, [chats, mounted]);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowChatList(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch chat list
  useEffect(() => {
    if (mounted) {
      fetchChatList();
    }
  }, [mounted]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup WebSocket event listeners
  useEffect(() => {
    // Listen for new messages
    on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Update last message in chat list
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.chatId === message.id // assuming message has chatId
            ? {
                ...chat,
                lastMessage: {
                  id: message.id,
                  content: message.content,
                  sender: message.sender,
                  createdAt: message.createdAt
                }
              }
            : chat
        )
      );
    });

    // Listen for typing indicators
    on('userTyping', (data) => {
      if (selectedChat?.chatId === data.chatId && data.userId !== currentUserId) {
        setTyping(true);
      }
    });

    on('userStoppedTyping', (data) => {
      if (selectedChat?.chatId === data.chatId && data.userId !== currentUserId) {
        setTyping(false);
      }
    });

    on('joinedChat', (data) => {
      console.log('Successfully joined chat:', data.chatId);
    });

    return () => {
      off('newMessage');
      off('userTyping');
      off('userStoppedTyping');
      off('joinedChat');
    };
  }, [selectedChat, currentUserId, on, off]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatList = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3000/api/chat/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chats: ${response.status}`);
      }

      const result = await response.json();
      setChats(result.data || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      // Mock data for development
      setChats([
        {
          chatId: 'chat1',
          event: {
            id: 'event1',
            title: 'Gaming Tournament Championship',
            image: '/api/placeholder/400/200',
            creator: {
              id: 'host1',
              name: 'Event Host',
              avatar: '/api/placeholder/40/40'
            }
          },
          participants: [{
            user: {
              id: 'user1',
              name: 'John Doe',
              avatar: '/api/placeholder/40/40'
            }
          }],
          lastMessage: {
            id: 'msg1',
            content: 'Thanks for organizing this event!',
            sender: {
              id: 'user1',
              name: 'John Doe'
            },
            createdAt: new Date().toISOString()
          },
          unreadCount: 2,
          joinedAt: new Date().toISOString()
        },
        {
          chatId: 'chat2',
          event: {
            id: 'event2',
            title: 'Tech Conference 2024',
            image: '/api/placeholder/400/200',
            creator: {
              id: 'host2',
              name: 'Tech Leader',
              avatar: '/api/placeholder/40/40'
            }
          },
          participants: [{
            user: {
              id: 'user2',
              name: 'Jane Smith',
              avatar: '/api/placeholder/40/40'
            }
          }],
          lastMessage: {
            id: 'msg2',
            content: 'What time does the keynote start?',
            sender: {
              id: 'user2',
              name: 'Jane Smith'
            },
            createdAt: new Date().toISOString()
          },
          unreadCount: 0,
          joinedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      setLoadingMessages(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:3000/api/chat/${chatId}/messages?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const result = await response.json();
      setMessages(result.data?.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      // Mock messages for development
      setMessages([
        {
          id: 'msg1',
          content: 'Hi! I have a question about the event.',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          sender: {
            id: 'user1',
            name: 'John Doe',
            avatar: '/api/placeholder/40/40'
          },
          receiver: {
            id: 'host1',
            name: 'Event Host',
            avatar: '/api/placeholder/40/40'
          }
        },
        {
          id: 'msg2',
          content: 'Sure! What would you like to know?',
          isRead: true,
          createdAt: new Date(Date.now() - 3000000).toISOString(),
          sender: {
            id: 'host1',
            name: 'Event Host',
            avatar: '/api/placeholder/40/40'
          },
          receiver: {
            id: 'user1',
            name: 'John Doe',
            avatar: '/api/placeholder/40/40'
          }
        }
      ]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.chatId);
    
    if (isMobile) {
      setShowChatList(false);
    }
    
    // Join chat room via WebSocket
    joinChat(chat.chatId);
    
    // Mark messages as read
    markChatAsRead(chat.chatId);
  };

  const markChatAsRead = async (chatId: string) => {
    // Update local state immediately
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.chatId === chatId 
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    );
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const currentUserId = 'current_user'; // Get from auth context
    const otherParticipant = selectedChat.participants[0];

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:3000/api/chat/${selectedChat.chatId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: otherParticipant.user.id,
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      // Add message to local state immediately for better UX
      const tempMessage: Message = {
        id: `temp_${Date.now()}`,
        content: newMessage,
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          name: 'You',
          avatar: '/api/placeholder/40/40'
        },
        receiver: otherParticipant.user
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Update last message in chat list
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.chatId === selectedChat.chatId
            ? {
                ...chat,
                lastMessage: {
                  id: tempMessage.id,
                  content: tempMessage.content,
                  sender: tempMessage.sender,
                  createdAt: tempMessage.createdAt
                }
              }
            : chat
        )
      );

    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      // Handle typing indicator
      if (selectedChat) {
        const otherParticipant = selectedChat.participants[0];
        startTyping(selectedChat.chatId, otherParticipant.user.id);
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
          stopTyping(selectedChat.chatId, otherParticipant.user.id);
        }, 1000);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredChats = chats.filter(chat =>
    chat.participants[0]?.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentUserId = () => 'current_user'; // Replace with actual auth context

  // Show loading state until component is mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              Messages
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                {chats.length} conversations
              </Badge>
              <Badge 
                variant="outline" 
                className={`${
                  isConnected 
                    ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                    : 'bg-red-500/20 text-red-300 border-red-400/30'
                }`}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
        <div className="flex h-full">
          {/* Chat List */}
          <div className={`${
            isMobile 
              ? (showChatList ? 'w-full' : 'hidden') 
              : 'w-1/3'
            } bg-white border-r border-gray-200 flex flex-col`}>
            
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-center">No conversations found</p>
                  <p className="text-sm text-center mt-2">
                    Join events to start chatting with hosts and participants
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.chatId}
                    onClick={() => handleChatSelect(chat)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedChat?.chatId === chat.chatId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={chat.participants[0]?.user.avatar || '/api/placeholder/40/40'}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/40/40';
                          }}
                        />
                        {onlineUsers.has(chat.participants[0]?.user.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {chat.participants[0]?.user.name}
                          </h4>
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {chat.event.title}
                        </p>
                        
                        {chat.lastMessage && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate">
                              {chat.lastMessage.content}
                            </p>
                            {chat.unreadCount > 0 && (
                              <Badge className="bg-blue-500 text-white text-xs min-w-[1.5rem] h-6 flex items-center justify-center rounded-full">
                                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`${
            isMobile 
              ? (showChatList ? 'hidden' : 'w-full') 
              : 'flex-1'
            } flex flex-col bg-white`}>
            
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isMobile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowChatList(true)}
                          className="mr-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <img
                        src={selectedChat.participants[0]?.user.avatar || '/api/placeholder/40/40'}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {selectedChat.participants[0]?.user.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{selectedChat.event.title}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-pulse text-gray-500">Loading messages...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm mt-2">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.sender.id === getCurrentUserId();
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                            isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                          }`}>
                            
                            {!isOwnMessage && (
                              <img
                                src={message.sender.avatar || '/api/placeholder/32/32'}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            
                            <div className={`px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-200 text-gray-800 rounded-bl-none'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              
                              {message.image && (
                                <img
                                  src={message.image}
                                  alt="Message attachment"
                                  className="mt-2 rounded max-w-full h-auto"
                                />
                              )}
                              
                              <p className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {typing && (
                    <div className="flex justify-start">
                      <div className="flex items-end space-x-2">
                        <img
                          src={selectedChat.participants[0]?.user.avatar || '/api/placeholder/32/32'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="bg-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="pr-10"
                      />
                      <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Smile className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p>Choose a chat from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}