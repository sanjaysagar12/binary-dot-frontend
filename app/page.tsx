'use client';

import { useState, useEffect } from 'react';

interface Event {
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
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    participants: number;
  };
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

  const truncateDescription = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const participantCount = event._count.participants;
  const maxParticipants = event.maxParticipants;
  const isEventFull = maxParticipants ? participantCount >= maxParticipants : false;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Event Image */}
      <div className="relative h-48">
        <img
          src={event.image || '/api/placeholder/400/200'}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/api/placeholder/400/200';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
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
          className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-blue-600 transition-colors duration-200"
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">{event.location}</span>
            </div>
          )}
          
          {/* Date & Time */}
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">{formatDate(event.startDate)}</span>
          </div>
          
          {/* Participants */}
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            <span className="text-sm">
              {participantCount}{maxParticipants ? `/${maxParticipants}` : ''} participants
            </span>
          </div>
          
          {/* Creator */}
          {event.creator && (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-medium">
                  {event.creator.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm">Created by {event.creator.name}</span>
            </div>
          )}
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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/event/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      } else {
        console.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('auth_token');
      console.log('Joining event with token:', token);
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
        fetchEvents();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join event');
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Something went wrong');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join competitions, connect with others, and showcase your skills in exciting events
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                No Events Available
              </h3>
              <p className="text-gray-500 text-lg">
                Check back later for exciting new events and competitions!
              </p>
            </div>
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
      </div>
    </div>
  );
}