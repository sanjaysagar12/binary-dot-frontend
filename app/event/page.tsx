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
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      {/* Event Image */}
      <div style={{ marginBottom: '15px' }}>
        <img
          src={event.image || '/api/placeholder/300/200'}
          alt={event.title}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0'
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/api/placeholder/300/200';
          }}
        />
      </div>

      {/* Event Title */}
      <h3 style={{
        margin: '0 0 10px 0',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        {event.title}
      </h3>

      {/* Event Description */}
      <p style={{
        margin: '0 0 15px 0',
        color: '#666',
        fontSize: '14px',
        lineHeight: '1.4'
      }}>
        {truncateDescription(event.description)}
      </p>

      {/* Event Details */}
      <div style={{ marginBottom: '15px', fontSize: '14px', color: '#555' }}>
        {/* Location */}
        {event.location && (
          <div style={{ marginBottom: '5px' }}>
            📍 {event.location}
          </div>
        )}
        
        {/* Date & Time */}
        <div style={{ marginBottom: '5px' }}>
          📅 {formatDate(event.startDate)}
        </div>
        
        {/* Participants */}
        <div style={{ marginBottom: '5px' }}>
          👥 {participantCount}{maxParticipants ? `/${maxParticipants}` : ''} participants
        </div>
        
        {/* Prize Pool */}
        {event.prizePool && (
          <div style={{ marginBottom: '5px' }}>
            💰 Prize Pool: ${event.prizePool}
          </div>
        )}
        
        {/* Creator */}
        {event.creator && (
          <div style={{ marginBottom: '5px' }}>
            👤 Created by: {event.creator.name}
          </div>
        )}
      </div>

      {/* Join Button */}
      <button
        onClick={() => onJoin(event.id)}
        disabled={isEventFull}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isEventFull ? '#95a5a6' : '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isEventFull ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s'
        }}
        onMouseEnter={(e) => {
          if (!isEventFull) {
            (e.target as HTMLButtonElement).style.backgroundColor = '#229954';
          }
        }}
        onMouseLeave={(e) => {
          if (!isEventFull) {
            (e.target as HTMLButtonElement).style.backgroundColor = '#27ae60';
          }
        }}
      >
        {isEventFull ? 'Event Full' : 'Join Event'}
      </button>
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
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>
        Loading events...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '32px',
        color: '#333'
      }}>
        Available Events
      </h1>

      {events.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          fontSize: '18px',
          color: '#666'
        }}>
          No events available
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
          padding: '0 10px'
        }}>
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
  );
}