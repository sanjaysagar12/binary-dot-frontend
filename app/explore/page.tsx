'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUp, 
  ArrowDown, 
  MessageCircle, 
  Share, 
  Bookmark, 
  MoreHorizontal,
  TrendingUp,
  Clock,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'top'>('hot');
  const [commentVotes, setCommentVotes] = useState<{[key: string]: 'up' | 'down' | null}>({});

  useEffect(() => {
    fetchAllComments();
  }, [activeTab]);

  const fetchAllComments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please login to view comments');
        setLoading(false);
        return;
      }

      const response = await fetch('https://api-avalink.portos.cloud/api/event/comments/all', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: CommentsResponse = await response.json();
        // Sort comments based on active tab
        let sortedComments = [...data.data];
        switch (activeTab) {
          case 'new':
            sortedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'top':
            sortedComments.sort((a, b) => b._count.replies - a._count.replies);
            break;
          default: // hot
            sortedComments.sort((a, b) => {
              const aScore = b._count.replies * 2 + (Date.now() - new Date(b.createdAt).getTime()) / 1000000;
              const bScore = a._count.replies * 2 + (Date.now() - new Date(a.createdAt).getTime()) / 1000000;
              return bScore - aScore;
            });
        }
        setComments(sortedComments);
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
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
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

  const handleVote = (commentId: string, voteType: 'up' | 'down') => {
    setCommentVotes(prev => ({
      ...prev,
      [commentId]: prev[commentId] === voteType ? null : voteType
    }));
  };

  const getTagColor = (tag: string) => {
    const colors: { [key: string]: string } = {
      web3: 'bg-blue-100 text-blue-800',
      defi: 'bg-green-100 text-green-800',
      nft: 'bg-purple-100 text-purple-800',
      crypto: 'bg-yellow-100 text-yellow-800',
      blockchain: 'bg-indigo-100 text-indigo-800'
    };
    return colors[tag] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#161616] flex items-center justify-center relative overflow-hidden">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('/Avalink.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="fixed inset-0 bg-black/60" />
        
        <div className="text-center relative z-10">
          <div className="w-8 h-8 border-2 border-[#E94042] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading discussions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#161616] flex items-center justify-center relative overflow-hidden">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('/Avalink.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="fixed inset-0 bg-black/60" />
        
        <Card className="w-96 text-center bg-white/5 backdrop-blur-md border border-white/20 shadow-xl relative z-10">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button
              onClick={() => window.location.href = '/auth/login'}
              className="bg-[#E94042] hover:bg-[#E94042]/90"
            >
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161616] relative overflow-hidden">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('/Avalink.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60" />

      {/* Header */}
      <div className="border-b border-gray-700 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-semibold text-white">Explore Discussions</h1>
              
              <nav className="flex space-x-4">
                {['hot', 'new', 'top'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab
                        ? 'bg-[#E94042] text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab === 'hot' && <TrendingUp className="w-4 h-4 mr-1 inline" />}
                    {tab === 'new' && <Clock className="w-4 h-4 mr-1 inline" />}
                    {tab === 'top' && <ArrowUp className="w-4 h-4 mr-1 inline" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/event/create'}
                className="border-gray-600 text-gray-300 bg-white text-black"
              >
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            {comments.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-md border border-white/20 shadow-xl">
                <CardContent className="text-center py-16">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Discussions Found</h3>
                  <p className="text-gray-300 mb-4">Be the first to start a conversation!</p>
                  <Button 
                    onClick={() => window.location.href = '/event'}
                    className="bg-white text-black"
                  >
                    Browse Events
                  </Button>
                </CardContent>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="bg-white/5 backdrop-blur-md border border-white/20 shadow-xl hover:bg-white/7 transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    
                    {/* Event Header */}
                    <div 
                      className="bg-gradient-to-r from-[#E94042] to-purple-600 p-4 cursor-pointer hover:from-[#E94042]/90 hover:to-purple-700 transition-all duration-200"
                      onClick={() => navigateToEvent(comment.event.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {comment.event.title}
                          </h3>
                          <p className="text-gray-200 text-sm">Click to view event</p>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30">
                          Discussion
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Comment Header */}
                      <div className="flex items-start space-x-3 mb-4">
                        <div className="flex flex-col items-center space-y-1">
                          <Button 
                            variant={commentVotes[comment.id] === 'up' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handleVote(comment.id, 'up')}
                            className={`p-2 ${commentVotes[comment.id] === 'up' ? 'bg-[#E94042] hover:bg-[#E94042]/90' : 'text-gray-300 hover:bg-white/10'}`}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <span className="font-medium text-sm text-white">
                            {(commentVotes[comment.id] === 'up' ? 1 : 0) - (commentVotes[comment.id] === 'down' ? 1 : 0)}
                          </span>
                          <Button 
                            variant={commentVotes[comment.id] === 'down' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handleVote(comment.id, 'down')}
                            className={`p-2 ${commentVotes[comment.id] === 'down' ? 'bg-[#E94042] hover:bg-[#E94042]/90' : 'text-gray-300 hover:bg-white/10'}`}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-[#E94042] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {comment.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <span className="font-medium text-white">u/{comment.user.name}</span>
                              <span>•</span>
                              <span>{formatDate(comment.createdAt)}</span>
                            </div>
                          </div>

                          {/* Comment Content */}
                          <div className="mb-4">
                            <p className="text-gray-300 leading-relaxed mb-3">
                              {comment.content}
                            </p>

                            {/* Comment Image */}
                            {comment.image && (
                              <div className="mb-4">
                                <img
                                  src={comment.image}
                                  alt="Comment attachment"
                                  className="max-w-md max-h-64 rounded-lg border border-gray-600 cursor-pointer hover:opacity-95 transition-opacity duration-200"
                                  onClick={() => window.open(comment.image, '_blank')}
                                />
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" className="space-x-1 text-gray-300 hover:bg-white/10">
                              <MessageCircle className="w-4 h-4" />
                              <span>{comment._count.replies}</span>
                            </Button>
                            
                            <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-white/10">
                              <Share className="w-4 h-4" />
                            </Button>
                            
                            <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-white/10">
                              <Bookmark className="w-4 h-4" />
                            </Button>

                            {comment.replies.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleReplies(comment.id)}
                                className="ml-auto text-[#E94042] hover:text-[#E94042]/80 hover:bg-white/10"
                              >
                                {expandedComments[comment.id] ? 'Hide' : 'Show'} {comment.replies.length} replies
                              </Button>
                            )}
                          </div>

                          {/* Replies */}
                          {expandedComments[comment.id] && comment.replies.length > 0 && (
                            <div className="mt-6 space-y-4">
                              <div className="border-l-2 border-gray-600 pl-6">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                                    <div className="flex items-center space-x-3 mb-3">
                                      <div className="w-6 h-6 bg-[#E94042] rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                          {reply.user.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-sm text-white">
                                          u/{reply.user.name}
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-xs text-gray-400">
                                          {formatDate(reply.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-sm leading-relaxed text-gray-300">
                                      {reply.content}
                                    </p>
                                    
                                    {/* Nested Replies */}
                                    {reply.childReplies.length > 0 && (
                                      <div className="mt-4 ml-6 space-y-3">
                                        {reply.childReplies.map((childReply) => (
                                          <div key={childReply.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                            <div className="flex items-center space-x-2 mb-2">
                                              <div className="w-5 h-5 bg-[#E94042] rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">
                                                  {childReply.user.name.charAt(0).toUpperCase()}
                                                </span>
                                              </div>
                                              <span className="font-medium text-xs text-white">
                                                u/{childReply.user.name}
                                              </span>
                                              <span className="text-gray-400">•</span>
                                              <span className="text-xs text-gray-400">
                                                {formatDate(childReply.createdAt)}
                                              </span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-gray-300">
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
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Trending Topics */}
            <Card className="bg-white/5 backdrop-blur-md border border-white/20 shadow-xl hover:bg-white/7 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <TrendingUp className="w-5 h-5" />
                  <span>Trending</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { tag: 'web3', posts: 1.2 },
                  { tag: 'defi', posts: 0.8 },
                  { tag: 'nft', posts: 0.6 },
                  { tag: 'blockchain', posts: 0.4 }
                ].map((topic) => (
                  <div key={topic.tag} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white">#{topic.tag}</span>
                      <p className="text-xs text-gray-400">{topic.posts}k discussions</p>
                    </div>
                    <Badge variant="outline" className="border-[#E94042] text-[#E94042]">
                      Trending
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card className="bg-white/5 backdrop-blur-md border border-white/20 shadow-xl hover:bg-white/7 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white">Community Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Discussions</span>
                  <span className="font-semibold text-white">{comments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Active Today</span>
                  <span className="font-semibold text-white">
                    {comments.filter(c => {
                      const today = new Date();
                      const commentDate = new Date(c.createdAt);
                      return commentDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Replies</span>
                  <span className="font-semibold text-white">
                    {comments.reduce((sum, c) => sum + c._count.replies, 0)}
                  </span>
                </div>
                <div className="border-t border-gray-600 pt-4 mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 bg-white text-black"
                    onClick={() => window.location.href = '/'}
                  >
                    Browse Events
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/5 backdrop-blur-md border border-white/20 shadow-xl hover:bg-white/7 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-600 text-gray-300 bg-white text-black"
                  onClick={() => window.location.href = '/event/create'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-600 text-gray-300 bg-white text-black"
                  onClick={() => window.location.href = '/event/my'}
                >
                  <Users className="w-4 h-4 mr-2" />
                  My Events
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}