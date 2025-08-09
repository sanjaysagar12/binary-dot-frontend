'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Event {
  id: string;
  title: string;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  parentReply: string | null;
  childReplies: Reply[];
}

interface Comment {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  event: Event;
  replies: Reply[];
  _count: {
    replies: number;
  };
}

interface CommentsResponse {
  status: string;
  data: Comment[];
}

export default function ExplorePage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchAllComments();
  }, []);

  const fetchAllComments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please login to view comments');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/event/comments/all', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: CommentsResponse = await response.json();
        setComments(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('An error occurred while fetching comments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const navigateToEvent = (eventId: string) => {
    window.location.href = `/event/${eventId}`;
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading comments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/event'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Explore All Comments
          </h1>
          <p className="text-gray-600">
            Discover conversations happening across all events • {comments.length} comments
          </p>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Comments Found</h3>
            <p className="text-gray-500">There are no comments to display at this time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Event Header */}
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  onClick={() => navigateToEvent(comment.event.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {comment.event.title}
                      </h3>
                      <p className="text-blue-100 text-sm">Click to view event</p>
                    </div>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <div className="p-6">
                  {/* Comment Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={comment.user.avatar || '/api/placeholder/40/40'}
                      alt={comment.user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">
                          {comment.user.name}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="mb-4">
                    <p className="text-gray-800 leading-relaxed mb-4">
                      {comment.content}
                    </p>

                    {/* Comment Image */}
                    {comment.image && (
                      <div className="mb-4">
                        <img
                          src={comment.image}
                          alt="Comment attachment"
                          className="max-w-md max-h-64 rounded-lg border border-gray-300 cursor-pointer hover:opacity-95 transition-opacity duration-200"
                          onClick={() => window.open(comment.image, '_blank')}
                        />
                      </div>
                    )}
                  </div>

                  {/* Comment Stats & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}</span>
                      </span>
                    </div>

                    {comment.replies.length > 0 && (
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                      >
                        <span>
                          {expandedComments[comment.id] ? 'Hide Replies' : 'View Replies'}
                        </span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${expandedComments[comment.id] ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Replies */}
                  {expandedComments[comment.id] && comment.replies.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="border-l-2 border-blue-200 pl-6">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <img
                                src={reply.user.avatar || '/api/placeholder/32/32'}
                                alt={reply.user.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-300"
                              />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {reply.user.name}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-800 text-sm leading-relaxed">
                              {reply.content}
                            </p>
                            
                            {/* Nested Replies */}
                            {reply.childReplies.length > 0 && (
                              <div className="mt-4 ml-6 space-y-3">
                                {reply.childReplies.map((childReply) => (
                                  <div key={childReply.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <img
                                        src={childReply.user.avatar || '/api/placeholder/24/24'}
                                        alt={childReply.user.name}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                      <span className="font-medium text-gray-900 text-xs">
                                        {childReply.user.name}
                                      </span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(childReply.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 text-xs leading-relaxed">
                                      {childReply.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}