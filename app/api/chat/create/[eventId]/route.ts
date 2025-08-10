import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const { participantId } = await request.json();

    // Simulate authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Mock response for creating/finding a chat
    const mockChatResponse = {
      status: 'success',
      data: {
        chatId: `chat_${eventId}_${participantId}`,
        eventId: eventId,
        participants: [
          {
            userId: 'current_user',
            role: 'participant'
          },
          {
            userId: participantId,
            role: 'host'
          }
        ],
        createdAt: new Date().toISOString(),
        isNew: false // false if chat already existed, true if newly created
      }
    };

    return NextResponse.json(mockChatResponse);
  } catch (error) {
    console.error('Error creating/finding chat:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to create chat' },
      { status: 500 }
    );
  }
}