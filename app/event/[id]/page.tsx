'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  MessageCircle, 
  Heart, 
  Share2,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Send,
  MoreHorizontal,
  Trophy,
  Image as ImageIcon,
  X
} from 'lucide-react';

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
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentVotes, setCommentVotes] = useState<{[key: string]: 'up' | 'down' | null}>({});

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
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    }
    return `${Math.floor(diffInHours / 24)}d ago`;
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
          alert('Failed to upload image: ' + uploadError.message);
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
        alert('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size must be less than 5MB');
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

  const handleVote = (commentId: string, voteType: 'up' | 'down') => {
    setCommentVotes(prev => ({
      ...prev,
      [commentId]: prev[commentId] === voteType ? null : voteType
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardContent className="pt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading event...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/event'}
              className="inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-semibold mb-4">Event not found</h1>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/event'}
              className="inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const participantCount = event?._count?.participants || 0;
  const isEventFull = event?.maxParticipants ? participantCount >= event.maxParticipants : false;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/event'}
              className="inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant={isBookmarked ? "default" : "outline"}
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Card */}
            <Card>
              {/* Event Image */}
              {event.image && (
                <div className="relative h-64 sm:h-80 rounded-t-lg overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      setImageErrors(prev => ({ ...prev, [event.id]: true }));
                      (e.target as HTMLImageElement).src = '/api/placeholder/400/250';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <Badge className="absolute top-4 right-4 bg-black text-white">
                    Event
                  </Badge>
                </div>
              )}

              <CardContent className="p-6 space-y-6">
                {/* Event Header */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {event.creator.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">r/Events</span>
                        <span>•</span>
                        <span>Posted by u/{event.creator.name}</span>
                        <span>•</span>
                        <span>{formatShortDate(event.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <h1 className="text-3xl font-bold leading-tight">{event.title}</h1>
                  <p className="text-muted-foreground leading-relaxed text-lg">{event.description}</p>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Date</span>
                    </div>
                    <div className="text-sm font-semibold">{formatDate(event.startDate)}</div>
                  </Card>

                  {event.location && (
                    <Card className="p-4">
                      <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Location</span>
                      </div>
                      <div className="text-sm font-semibold">{event.location}</div>
                    </Card>
                  )}

                  <Card className="p-4">
                    <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Attendees</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {participantCount}{event.maxParticipants ? `/${event.maxParticipants}` : ''}
                    </div>
                  </Card>

                  {event.prizePool && (
                    <Card className="p-4 bg-black text-white">
                      <div className="flex items-center space-x-2 text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Prize Pool</span>
                      </div>
                      <div className="text-sm font-semibold">${event.prizePool.toLocaleString()}</div>
                    </Card>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    {/* <div className="flex items-center bg-muted rounded-full">
                      <Button variant="ghost" size="sm" className="rounded-l-full px-3">
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <span className="px-3 py-2 text-sm font-medium">128</span>
                      <Button variant="ghost" size="sm" className="rounded-r-full px-3">
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div> */}

                    <Button variant="ghost" size="sm" className="space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>{event.comments.length}</span>
                    </Button>

                    <Button 
                      variant={isLiked ? "default" : "ghost"} 
                      size="sm"
                      onClick={() => setIsLiked(!isLiked)}
                      className="space-x-2"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>Like</span>
                    </Button>
                  </div>

                  {!isEventFull && (
                    <Button onClick={handleJoinEvent} className="bg-black hover:bg-gray-800">
                      Join Event
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comment Input */}
            <Card>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">U</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this event..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-32 w-32 object-cover rounded-lg border"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <Button variant="ghost" size="sm" className="space-x-2">
                            <ImageIcon className="w-4 h-4" />
                            <span>Add Image</span>
                          </Button>
                        </label>
                      </div>
                      
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || uploading}
                        className="space-x-2 bg-black hover:bg-gray-800"
                      >
                        <Send className="w-4 h-4" />
                        <span>{uploading ? 'Posting...' : 'Post Comment'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Comments ({event.comments.length})</h3>
              
              {event.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center space-y-1">
                        <Button
                          variant={commentVotes[comment.id] === 'up' ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleVote(comment.id, 'up')}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <span className="text-xs font-medium">0</span>
                        <Button
                          variant={commentVotes[comment.id] === 'down' ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleVote(comment.id, 'down')}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">u/{comment.user.name}</span>
                          <span className="text-xs text-muted-foreground">{formatShortDate(comment.createdAt)}</span>
                        </div>
                        
                        <p className="text-muted-foreground leading-relaxed">{comment.content}</p>
                        
                        {/* Comment Image */}
                        {comment.image && (
                          <div className="mt-3">
                            <img 
                              src={comment.image} 
                              alt="Comment attachment" 
                              className="max-w-md h-auto rounded-lg border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          >
                            Reply
                          </Button>
                          <Button variant="ghost" size="sm">Share</Button>
                          <Button variant="ghost" size="sm">Report</Button>
                          {comment.replies.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleReplies(comment.id)}
                            >
                              {showReplies[comment.id] ? 'Hide' : 'Show'} {comment.replies.length} replies
                            </Button>
                          )}
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                          <div className="mt-4 ml-6 border-l-2 border-muted pl-4">
                            <div className="flex space-x-2">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                rows={2}
                                className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-black"
                              />
                              <div className="flex flex-col space-y-2">
                                <Button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={!replyContent.trim()}
                                  size="sm"
                                  className="bg-black hover:bg-gray-800"
                                >
                                  Reply
                                </Button>
                                <Button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent('');
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {showReplies[comment.id] && comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 ml-6 border-l-2 border-muted pl-4 space-y-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex space-x-3">
                                <div className="flex flex-col items-center space-y-1">
                                  <Button variant="ghost" size="sm">
                                    <ChevronUp className="w-3 h-3" />
                                  </Button>
                                  <span className="text-xs font-medium">0</span>
                                  <Button variant="ghost" size="sm">
                                    <ChevronDown className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-sm">u/{reply.user.name}</span>
                                    <span className="text-xs text-muted-foreground">{formatShortDate(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-muted-foreground text-sm leading-relaxed">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Information */}
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Created</span>
                  <span className="font-medium text-sm">{formatShortDate(event.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Participants</span>
                  <span className="font-medium text-sm">{participantCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Comments</span>
                  <span className="font-medium text-sm">{event.comments.length}</span>
                </div>
                {event.prizePool && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Prize Pool</span>
                        <span className="font-semibold">${event.prizePool.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Prizes */}
            {event.prizes && event.prizes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Prizes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.prizes.sort((a, b) => a.position - b.position).map((prize) => (
                    <div key={prize.id} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{prize.title}</span>
                      <Badge variant="outline">${prize.amount.toLocaleString()}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Participants */}
            {event.participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Participants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.participants.slice(0, 5).map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-xs font-medium">
                          {participant.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">u/{participant.user.name}</span>
                        <div className="text-xs text-muted-foreground">
                          Joined {formatShortDate(participant.joinedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {event.participants.length > 5 && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      +{event.participants.length - 5} more participants
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
