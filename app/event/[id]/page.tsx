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
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login to add a comment');
        return;
      }

      const response = await fetch('http://localhost:3000/api/event/comment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          eventId: eventId
        }),
      });

      if (response.ok) {
        alert('Comment added successfully!');
        setNewComment('');
        fetchEventDetail(eventId); // Refresh event data
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Something went wrong');
    }
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Back Button */}
      <button
        onClick={() => window.location.href = '/event'}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Events
      </button>

      {/* Event Header */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        {/* Event Image */}
        {event.image && (
          <div style={{ marginBottom: '20px' }}>
            <img
              src={event.image}
              alt={event.title}
              style={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
          </div>
        )}

        {/* Event Title and Creator */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            margin: '0 0 10px 0',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {event.title}
          </h1>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            👤 Created by: <strong>{event.creator.name}</strong>
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            Created on {formatShortDate(event.createdAt)}
          </div>
        </div>

        {/* Event Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>📅 Event Dates</h3>
            <div style={{ color: '#666' }}>
              <div><strong>Starts:</strong> {formatDate(event.startDate)}</div>
              <div><strong>Ends:</strong> {formatDate(event.endDate)}</div>
            </div>
          </div>

          {event.location && (
            <div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>📍 Location</h3>
              <div style={{ color: '#666' }}>{event.location}</div>
            </div>
          )}

          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>👥 Participants</h3>
            <div style={{ color: '#666' }}>
              {participantCount}{event.maxParticipants ? `/${event.maxParticipants}` : ''} registered
            </div>
          </div>

          {event.prizePool && (
            <div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>💰 Prize Pool</h3>
              <div style={{ color: '#666' }}>${event.prizePool}</div>
            </div>
          )}
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoinEvent}
          disabled={isEventFull || !event.isActive}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: isEventFull || !event.isActive ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: isEventFull || !event.isActive ? 'not-allowed' : 'pointer'
          }}
        >
          {!event.isActive ? 'Event Inactive' : isEventFull ? 'Event Full' : 'Join Event'}
        </button>
      </div>

      {/* Event Description */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>📝 Description</h2>
        <p style={{
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap'
        }}>
          {event.description}
        </p>
      </div>

      {/* Prizes Section */}
      {event.prizes.length > 0 && (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>🏆 Prizes</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {event.prizes
              .sort((a, b) => a.position - b.position)
              .map((prize) => (
                <div
                  key={prize.id}
                  style={{
                    border: '2px solid #f39c12',
                    borderRadius: '8px',
                    padding: '15px',
                    textAlign: 'center',
                    backgroundColor: '#fef9e7'
                  }}
                >
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#f39c12',
                    marginBottom: '5px'
                  }}>
                    #{prize.position}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '5px'
                  }}>
                    {prize.title}
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#27ae60'
                  }}>
                    ${prize.amount}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Participants Section */}
      {event.participants.length > 0 && (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
            👥 Participants ({event.participants.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {event.participants.map((participant) => (
              <div
                key={participant.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <img
                  src={participant.user.avatar || '/api/placeholder/40/40'}
                  alt={participant.user.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <div>
                  <div style={{
                    fontWeight: 'bold',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    {participant.user.name}
                  </div>
                  <div style={{
                    color: '#666',
                    fontSize: '12px'
                  }}>
                    Joined {formatShortDate(participant.joinedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          💬 Comments ({event._count.comments})
        </h2>

        {/* Add Comment Form */}
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>
            Add a Comment
          </h3>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            maxLength={1000}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '10px'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {newComment.length}/1000 characters
            </span>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: newComment.trim() ? '#3498db' : '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Post Comment
            </button>
          </div>
        </div>

        {/* Comments List */}
        {event.comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {event.comments.map((comment) => (
              <div key={comment.id} style={{
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '20px'
              }}>
                {/* Comment Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <img
                    src={comment.user.avatar || '/api/placeholder/40/40'}
                    alt={comment.user.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <div>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: '14px'
                    }}>
                      {comment.user.name}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '12px'
                    }}>
                      {formatShortDate(comment.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Comment Content */}
                <p style={{
                  margin: '0 0 15px 0',
                  color: '#333',
                  lineHeight: '1.5',
                  fontSize: '14px'
                }}>
                  {comment.content}
                </p>

                {/* Comment Actions */}
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3498db',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '0'
                    }}
                  >
                    {replyingTo === comment.id ? 'Cancel Reply' : 'Reply'}
                  </button>
                  
                  {comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: '0'
                      }}
                    >
                      {showReplies[comment.id] ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div style={{
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#f1f3f4',
                    borderRadius: '6px'
                  }}>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      maxLength={1000}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        marginBottom: '8px'
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyContent.trim()}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: replyContent.trim() ? '#3498db' : '#95a5a6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: replyContent.trim() ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Post Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {showReplies[comment.id] && comment.replies.length > 0 && (
                  <div style={{
                    marginLeft: '20px',
                    paddingLeft: '20px',
                    borderLeft: '3px solid #e9ecef'
                  }}>
                    {comment.replies.map((reply) => (
                      <div key={reply.id} style={{
                        marginTop: '15px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '8px'
                        }}>
                          <img
                            src={reply.user.avatar || '/api/placeholder/32/32'}
                            alt={reply.user.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                          <div>
                            <span style={{
                              fontWeight: 'bold',
                              fontSize: '13px',
                              color: '#333'
                            }}>
                              {reply.user.name}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: '#666',
                              marginLeft: '8px'
                            }}>
                              {formatShortDate(reply.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p style={{
                          margin: '0',
                          fontSize: '13px',
                          color: '#333',
                          lineHeight: '1.4'
                        }}>
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
  );
}
