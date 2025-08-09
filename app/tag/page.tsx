'use client';

import { useState, useEffect } from 'react';

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
  prizes: Array<{
    id: string;
    position: number;
    amount: number;
    title: string;
  }>;
  _count: {
    participants: number;
  };
}

interface EventResponse {
  status: string;
  data: Event[];
}

interface EventCardProps {
  event: Event;
  onJoin: (eventId: string) => void;
}

const EventCard = ({ event, onJoin }: EventCardProps) => {
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

  const truncateDescription = (text: string, maxLength: number = 120) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const participantCount = event._count.participants;
  const maxParticipants = event.maxParticipants;
  const isEventFull = maxParticipants ? participantCount >= maxParticipants : false;

  const getTagColor = (tag: string) => {
    if (!tag) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const colors: { [key: string]: string } = {
      gaming: 'bg-purple-100 text-purple-800 border-purple-200',
      sports: 'bg-green-100 text-green-800 border-green-200',
      tech: 'bg-blue-100 text-blue-800 border-blue-200',
      music: 'bg-pink-100 text-pink-800 border-pink-200',
      art: 'bg-orange-100 text-orange-800 border-orange-200',
      food: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      education: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      business: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Event Image */}
      <div className="relative h-48">
        <img
          src={event.image || '/api/placeholder/400/200'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/api/placeholder/400/200';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        {/* Tag Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border ${getTagColor(event.tag)}`}>
          #{event.tag || 'general'}
        </div>

        {/* Prize Pool Badge */}
        {event.prizePool && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            ${event.prizePool}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Event Title */}
        <h3 
          className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-blue-600 transition-colors duration-200 line-clamp-2"
          onClick={() => window.location.href = `/event/${event.id}`}
        >
          {event.title}
        </h3>

        {/* Event Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {truncateDescription(event.description)}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-6">
          {/* Location */}
          {event.location && (
            <div className="flex items-center space-x-2 text-gray-600">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm truncate">{event.location}</span>
            </div>
          )}
          
          {/* Date & Time */}
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">{formatDate(event.startDate)}</span>
          </div>
          
          {/* Participants */}
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            <span className="text-sm">
              {participantCount}{maxParticipants ? `/${maxParticipants}` : ''} participants
            </span>
          </div>
          
          {/* Creator */}
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs font-medium">
                {event.creator.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm truncate">by {event.creator.name}</span>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={() => onJoin(event.id)}
          disabled={isEventFull}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            isEventFull
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-[0.98] shadow-sm hover:shadow-md'
          }`}
        >
          {isEventFull ? 'Event Full' : 'Join Event'}
        </button>
      </div>
    </div>
  );
};

export default function TagPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const popularTags = [
    { name: 'gaming', icon: '🎮', color: 'purple' },
    { name: 'sports', icon: '⚽', color: 'green' },
    { name: 'tech', icon: '💻', color: 'blue' },
    { name: 'music', icon: '🎵', color: 'pink' },
    { name: 'art', icon: '🎨', color: 'orange' },
    { name: 'food', icon: '🍕', color: 'yellow' },
    { name: 'education', icon: '📚', color: 'indigo' },
    { name: 'business', icon: '💼', color: 'gray' },
  ];

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/event/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data: EventResponse = await response.json();
        setEvents(data.data || []);
      } else {
        setError('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('An error occurred while fetching events');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsByTag = async (tag: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3000/api/event/tag/${encodeURIComponent(tag)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data: EventResponse = await response.json();
        setEvents(data.data || []);
      } else {
        setError(`Failed to fetch events for tag: ${tag}`);
      }
    } catch (error) {
      console.error('Error fetching events by tag:', error);
      setError('An error occurred while fetching events');
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    if (tag) {
      fetchEventsByTag(tag);
    } else {
      fetchAllEvents();
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please login to join an event');
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
        // Refresh events list to update participant count
        if (selectedTag) {
          fetchEventsByTag(selectedTag);
        } else {
          fetchAllEvents();
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join event');
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Something went wrong');
    }
  };

  const getTagButtonColor = (tagName: string, tagColor: string) => {
    const isSelected = selectedTag === tagName;
    const colorClasses: { [key: string]: string } = {
      purple: isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      green: isSelected ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      blue: isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      pink: isSelected ? 'bg-pink-600 text-white border-pink-600' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
      orange: isSelected ? 'bg-orange-600 text-white border-orange-600' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      yellow: isSelected ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
      indigo: isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      gray: isSelected ? 'bg-gray-600 text-white border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
    };
    return colorClasses[tagColor] || colorClasses.gray;
  };

  // Load all events on component mount
  useEffect(() => {
    fetchAllEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Events by Category
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Filter and explore events that match your interests
          </p>
        </div>

        {/* Tag Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {/* All Events Button */}
            <button
              onClick={() => handleTagSelect(null)}
              className={`px-6 py-3 rounded-full font-semibold border-2 transition-all duration-200 flex items-center space-x-2 ${
                selectedTag === null
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <span>🏷️</span>
              <span>All Events</span>
            </button>

            {/* Tag Buttons */}
            {popularTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleTagSelect(tag.name)}
                className={`px-6 py-3 rounded-full font-semibold border-2 transition-all duration-200 flex items-center space-x-2 capitalize ${getTagButtonColor(tag.name, tag.color)}`}
              >
                <span>{tag.icon}</span>
                <span>#{tag.name}</span>
              </button>
            ))}
          </div>

          {/* Results Info */}
          <div className="text-center">
            {selectedTag ? (
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{events.length}</span> events in{' '}
                <span className="font-semibold text-blue-600">#{selectedTag}</span>
              </p>
            ) : (
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{events.length}</span> total events
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-600 font-medium">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Events</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => selectedTag ? fetchEventsByTag(selectedTag) : fetchAllEvents()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && (
          <>
            {events.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {selectedTag ? `No events found for #${selectedTag}` : 'No events available'}
                </h3>
                <p className="text-gray-500">
                  {selectedTag ? 'Try selecting a different tag or check back later.' : 'Check back later for exciting new events!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onJoin={handleJoinEvent} 
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}