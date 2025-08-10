import { NextRequest, NextResponse } from 'next/server';

// Mock chat list data for testing
const mockChats = [
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
];

export async function GET(request: NextRequest) {
  try {
    // Simulate authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Return mock chat list
    return NextResponse.json({
      status: 'success',
      data: mockChats
    });
  } catch (error) {
    console.error('Error fetching chat list:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}