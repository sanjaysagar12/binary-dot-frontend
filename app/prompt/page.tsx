'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Calendar, Users, DollarSign, MapPin, Loader2, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  events?: Event[];
}

interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  location?: string;
  tag: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  prizePool?: number;
  numberOfPrizes?: number;
  isActive: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    participants: number;
  };
}

const EventCard = ({ event }: { event: Event }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTagColor = (tag: string) => {
    // Handle null, undefined, or empty tag values
    if (!tag || typeof tag !== 'string') {
      return 'bg-gray-100 text-gray-800';
    }
    
    const colors: { [key: string]: string } = {
      gaming: 'bg-purple-100 text-purple-800',
      sports: 'bg-green-100 text-green-800',
      tech: 'bg-blue-100 text-blue-800',
      music: 'bg-pink-100 text-pink-800',
      art: 'bg-orange-100 text-orange-800',
      food: 'bg-yellow-100 text-yellow-800',
      education: 'bg-indigo-100 text-indigo-800',
      business: 'bg-gray-100 text-gray-800',
    };
    return colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow mb-3"
      onClick={() => window.location.href = `/event/${event.id}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-sm line-clamp-2">{event.title}</h4>
          <Badge className={`text-xs ${getTagColor(event.tag)}`}>
            #{event.tag || 'general'}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{event.description}</p>
        
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{event._count.participants} participants</span>
          </div>
          {event.prizePool && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>${event.prizePool}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Component to handle client-side timestamp formatting
const MessageTimestamp = ({ timestamp }: { timestamp: Date }) => {
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    // Only format on client side to avoid hydration mismatch
    setFormattedTime(timestamp.toLocaleTimeString());
  }, [timestamp]);

  return (
    <p className="text-xs opacity-70 mt-2">
      {formattedTime}
    </p>
  );
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages on client side only
  useEffect(() => {
    setMounted(true);
    setMessages([
      {
        id: '1',
        content: 'Hello! I\'m your AI assistant. I can help you find events by category (gaming, tech, sports, etc.) or answer questions about blockchain and cryptocurrency. What would you like to know?',
        type: 'assistant',
        timestamp: new Date(),
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        type: 'assistant',
        timestamp: new Date(),
        events: data.events || undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        type: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "Show me gaming events",
    "Find tech events",
    "What are sports events available?",
    "What is blockchain?",
    "Explain smart contracts",
    "What is DeFi?",
  ];

  // Show loading state until component is mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <MessageCircle className="w-8 h-8" />
              AI Assistant
            </h1>
            <p className="text-gray-300">Ask about events or blockchain technology</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col h-[calc(100vh-200px)]">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`rounded-lg p-4 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Events Display */}
                    {message.events && message.events.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-gray-600">Related Events:</p>
                        {message.events.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                    
                    <MessageTimestamp timestamp={message.timestamp} />
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(question)}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about events or blockchain..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Ask about finding events by category (gaming, tech, sports, etc.) or blockchain topics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}