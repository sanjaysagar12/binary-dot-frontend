'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Prize {
  id: string;
  position: number;
  amount: number;
  title: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Participant {
  id: string;
  joinedAt: string;
  status: string;
  user: User;
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
  replies: Reply[];
  _count: {
    replies: number;
  };
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  image?: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  prizePool?: number;
  numberOfPrizes?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: User;
  prizes: Prize[];
  participants: Participant[];
  comments: Comment[];
  _count: {
    participants: number;
    comments: number;
  };
}

interface EventResponse {
  status: string;
  data: EventDetail;
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState<{[key: string]: boolean}>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (eventId) {
      fetchEventDetail(eventId);
    }
  }, [eventId]);

  const fetchEventDetail = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/event/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
    
      if (response.ok) {
        const data: EventResponse = await response.json();
        setEvent(data.data);
      } else {
        setError('Failed to fetch event details');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('An error occurred while fetching event details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleJoinEvent = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login to join this event');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/event/join/${eventId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Successfully joined event!');
        fetchEventDetail(eventId); // Refresh event data
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join event');
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Something went wrong');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setUploading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login to add a comment');
        return;
      }

      let imageUrl = null;
      
      // Step 1: Upload image if selected
      if (selectedImage) {
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (uploadError: any) {
          alert(`Image upload failed: ${uploadError.message}`);
          setUploading(false);
          return;
        }
      }

      // Step 2: Create comment with image URL
      const response = await fetch('http://localhost:3000/api/event/comment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          eventId: eventId,
          image: imageUrl
        }),
      });

      if (response.ok) {
        alert('Comment added successfully!');
        setNewComment('');
        setSelectedImage(null);
        setImagePreview(null);
        fetchEventDetail(eventId); // Refresh event data
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Something went wrong while posting comment');
    } finally {
      setUploading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    // Upload to server and get URL back
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:3000/api/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Image upload failed');
    }
    
    const result = await response.json();
    return result.data.imageUrl; // Return the URL from server response
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, PNG, GIF, and WebP images are allowed');
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = ''; // Reset file input
        return;
      }

      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login to add a reply');
        return;
      }

      const response = await fetch('http://localhost:3000/api/event/comment/reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          commentId: commentId
        }),
      });

      if (response.ok) {
        alert('Reply added successfully!');
        setReplyContent('');
        setReplyingTo(null);
        fetchEventDetail(eventId); // Refresh event data
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Something went wrong');
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>
        Loading event details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ color: '#e74c3c', fontSize: '18px', marginBottom: '20px' }}>
          {error}
        </div>
        <button
          onClick={() => window.location.href = '/event'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Events
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>
        Event not found
      </div>
    );
  }

  const participantCount = event._count.participants;
  const isEventFull = event.maxParticipants ? participantCount >= event.maxParticipants : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => window.location.href = '/event'}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Events</span>
        </button>

        {/* Event Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Event Image */}
          {event.image && (
            <div className="relative h-64 md:h-80">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          )}

          <div className="p-6">
            {/* Event Title and Creator */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {event.title}
              </h1>
              <div className="flex items-center space-x-3 text-gray-600 mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {event.creator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{event.creator.name}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Created on {formatShortDate(event.createdAt)}
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-sm">Event Dates</span>
                </div>
                <div className="text-sm text-gray-700">
                  <div><strong>Starts:</strong> {formatDate(event.startDate)}</div>
                  <div><strong>Ends:</strong> {formatDate(event.endDate)}</div>
                </div>
              </div>

              {event.location && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium text-sm">Location</span>
                  </div>
                  <div className="text-sm text-gray-700">{event.location}</div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="font-medium text-sm">Participants</span>
                </div>
                <div className="text-sm text-gray-700">
                  {participantCount}{event.maxParticipants ? `/${event.maxParticipants}` : ''} registered
                </div>
              </div>

              {event.prizePool && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="font-medium text-sm">Prize Pool</span>
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">${event.prizePool}</div>
                </div>
              )}
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoinEvent}
              disabled={isEventFull || !event.isActive}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                isEventFull || !event.isActive
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:transform active:scale-[0.98] shadow-sm hover:shadow-md'
              }`}
            >
              {!event.isActive ? 'Event Inactive' : isEventFull ? 'Event Full' : 'Join Event'}
            </button>
          </div>
        </div>

        {/* Event Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Description</span>
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        {/* Prizes Section */}
        {event.prizes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
              <span>Prizes</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.prizes
                .sort((a, b) => a.position - b.position)
                .map((prize) => (
                  <div
                    key={prize.id}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400 rounded-bl-full opacity-20"></div>
                    <div className="relative z-10">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        #{prize.position}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 mb-2">
                        {prize.title}
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        ${prize.amount}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Participants Section */}
        {event.participants.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>Participants ({event.participants.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                >
                  <img
                    src={participant.user.avatar || '/api/placeholder/40/40'}
                    alt={participant.user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {participant.user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Joined {formatShortDate(participant.joinedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comments ({event._count.comments})</span>
          </h2>

          {/* Add Comment Form */}
          <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Share your thoughts
            </h3>
            
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What's on your mind about this event?"
              maxLength={1000}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
              rows={4}
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs max-h-40 rounded-lg border border-gray-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {newComment.length}/1000
                </span>
                
                {/* Image Upload Button */}
                <label className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || uploading}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  newComment.trim() && !uploading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95 shadow-sm hover:shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  'Post Comment'
                )}
              </button>
            </div>
          </div>

          {/* Comments List */}
          {event.comments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No comments yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {event.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  {/* Comment Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={comment.user.avatar || '/api/placeholder/40/40'}
                      alt={comment.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {comment.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatShortDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <p className="text-gray-800 leading-relaxed mb-4">
                    {comment.content}
                  </p>

                  {/* Comment Image */}
                  {comment.image && !imageErrors[comment.id] && (
                    <div className="mb-4">
                      <img
                        src={comment.image}
                        alt="Comment attachment"
                        className="max-w-md max-h-64 rounded-lg border border-gray-300 cursor-pointer hover:opacity-95 transition-opacity duration-200"
                        onClick={() => window.open(comment.image, '_blank')}
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, [comment.id]: true }));
                        }}
                      />
                    </div>
                  )}

                  {/* Image Error State */}
                  {comment.image && imageErrors[comment.id] && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">Image failed to load</span>
                      </div>
                    </div>
                  )}

                  {/* Comment Actions */}
                  <div className="flex items-center space-x-4 mb-4">
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span>{replyingTo === comment.id ? 'Cancel' : 'Reply'}</span>
                    </button>
                    
                    {comment.replies.length > 0 && (
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 font-medium text-sm transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>
                          {showReplies[comment.id] ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mb-4 p-4 bg-white rounded-lg border border-gray-300">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        maxLength={1000}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                        rows={3}
                      />
                      <div className="flex items-center justify-end space-x-3 mt-3">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium text-sm transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddReply(comment.id)}
                          disabled={!replyContent.trim()}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                            replyContent.trim()
                              ? 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {showReplies[comment.id] && comment.replies.length > 0 && (
                    <div className="ml-6 pl-6 border-l-2 border-gray-300 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <img
                              src={reply.user.avatar || '/api/placeholder/32/32'}
                              alt={reply.user.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-300"
                            />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {reply.user.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatShortDate(reply.createdAt)}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-800 text-sm leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
