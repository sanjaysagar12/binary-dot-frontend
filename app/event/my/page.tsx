'use client';

import React, { useState, useEffect } from 'react';

// Type definitions
interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  tag?: string;
  prizePool?: number;
  numberOfPrizes?: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  isActive: boolean;
  _count?: {
    participants: number;
    comments: number;
  };
}

interface Participant {
  id: string;
  status: string;
  joinedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    walletAddress?: string;
  };
}

interface Winner {
  position: number;
  userId: string;
  prizeAmount: number;
}

interface EventCardProps {
  event: Event;
  onEventClick: (eventId: string) => void;
  onCompleteEvent: (eventId: string) => void;
  isCreator: boolean;
}

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onEventUpdated: () => void;
}

// EventCard Component
const EventCard: React.FC<EventCardProps> = ({ event, onEventClick, onCompleteEvent, isCreator }) => {
  const isCompleted = event.isCompleted;
  const isActive = event.isActive;
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black transition-colors cursor-pointer">
      {/* Event Image */}
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
        {event.image ? (
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-black line-clamp-2">{event.title}</h3>
          <div className="flex gap-2 ml-2">
            {/* Status Badges */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              isCompleted 
                ? 'bg-green-100 text-green-800' 
                : isActive 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {isCompleted ? 'Completed' : isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {event.tag && (
          <span className="inline-block bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full mb-3">
            #{event.tag}
          </span>
        )}

        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{event.description}</p>

        {/* Event Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Participants:</span>
            <span className="font-semibold ml-1">{event._count?.participants || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Comments:</span>
            <span className="font-semibold ml-1">{event._count?.comments || 0}</span>
          </div>
          {event.prizePool && (
            <div className="col-span-2">
              <span className="text-gray-500">Prize Pool:</span>
              <span className="font-semibold ml-1 text-green-600">${event.prizePool}</span>
            </div>
          )}
        </div>

        {/* Event Dates */}
        <div className="mt-3 text-sm text-gray-500">
          <div>Start: {new Date(event.startDate).toLocaleDateString()}</div>
          <div>End: {new Date(event.endDate).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onEventClick(event.id)}
          className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          View Details
        </button>

        {isCreator && !isCompleted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompleteEvent(event.id);
            }}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
};

// EventDetailsModal Component
const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, onEventUpdated }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/event/${event.id}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      setParticipants(result.data?.filter((p: Participant) => p.status === 'JOINED') || []);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize winners based on prize count
  useEffect(() => {
    if (event.numberOfPrizes) {
      setSelectedWinners(Array(event.numberOfPrizes).fill(null).map((_, index) => ({
        position: index + 1,
        userId: '',
        prizeAmount: 0
      })));
    }
    fetchParticipants();
  }, [event]);

  // Handle winner selection
  const handleWinnerSelect = (position: number, userId: string) => {
    setSelectedWinners(prev => 
      prev.map(winner => 
        winner.position === position 
          ? { ...winner, userId }
          : winner
      )
    );
  };

  // Handle prize amount change
  const handlePrizeAmountChange = (position: number, amount: string) => {
    setSelectedWinners(prev => 
      prev.map(winner => 
        winner.position === position 
          ? { ...winner, prizeAmount: parseFloat(amount) || 0 }
          : winner
      )
    );
  };

  // Submit winners
  const handleSubmitWinners = async () => {
    const validWinners = selectedWinners.filter(w => w.userId);
    
    if (validWinners.length === 0) {
      alert('Please select at least one winner');
      return;
    }

    if (!confirm(`Are you sure you want to select ${validWinners.length} winners and complete this event?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/event/${event.id}/select-winners`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ winners: validWinners })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert('Winners selected successfully! Event has been completed.');
      onEventUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to select winners:', error);
      alert('Failed to select winners');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-black text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{event.title}</h2>
              <p className="text-gray-300 mt-1">Event Management</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Event Info */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-black">{participants.length}</div>
                <div className="text-gray-600">Participants</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${event.prizePool || 0}</div>
                <div className="text-gray-600">Prize Pool</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{event.numberOfPrizes || 0}</div>
                <div className="text-gray-600">Prizes</div>
              </div>
            </div>

            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.isCompleted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {event.isCompleted ? 'Completed' : 'Active'}
              </span>
              {event.tag && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  #{event.tag}
                </span>
              )}
            </div>
          </div>

          {/* Winner Selection */}
          {!event.isCompleted && (event.numberOfPrizes ?? 0) > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Select Winners</h3>
              
              <div className="space-y-4">
                {selectedWinners.map((winner, index) => (
                  <div key={winner.position} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                          {winner.position}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {winner.position === 1 ? '1st Place' : 
                           winner.position === 2 ? '2nd Place' : 
                           winner.position === 3 ? '3rd Place' : 
                           `${winner.position}th Place`}
                        </label>
                        <select
                          value={winner.userId}
                          onChange={(e) => handleWinnerSelect(winner.position, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                        >
                          <option value="">Select a winner...</option>
                          {participants
                            .filter(p => !selectedWinners.some(w => w.userId === p.user?.id && w.position !== winner.position))
                            .map(participant => (
                              <option key={participant.user?.id} value={participant.user?.id}>
                                {participant.user?.name} ({participant.user?.email})
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prize Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={winner.prizeAmount}
                          onChange={(e) => handlePrizeAmountChange(winner.position, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSubmitWinners}
                  disabled={submitting || selectedWinners.filter(w => w.userId).length === 0}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Selecting Winners...' : 'Select Winners & Complete Event'}
                </button>
              </div>
            </div>
          )}

          {/* Participants List */}
          <div>
            <h3 className="text-xl font-bold text-black mb-4">
              Participants ({participants.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading participants...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No participants yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-black">{participant.user?.name}</div>
                        <div className="text-sm text-gray-600">{participant.user?.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Joined: {new Date(participant.joinedAt).toLocaleDateString()}
                        </div>
                        {participant.user?.walletAddress && (
                          <div className="text-xs text-gray-500 font-mono">
                            🔗 {participant.user.walletAddress.slice(0, 10)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main EventManagementPage Component
const EventManagementPage = () => {
  const [events, setEvents] = useState<{ createdEvents: Event[], participatingEvents: Event[] }>({ createdEvents: [], participatingEvents: [] });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user's events
  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/event/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      setEvents(result.data || { createdEvents: [], participatingEvents: [] });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents({ createdEvents: [], participatingEvents: [] });
    } finally {
      setLoading(false);
    }
  };

  // Handle event click to view details
  const handleEventClick = async (eventId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      setSelectedEvent(result.data);
      setShowEventDetails(true);
    } catch (error) {
      console.error('Failed to fetch event details:', error);
    }
  };

  // Quick complete event
  const handleCompleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to mark this event as completed?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/event/${eventId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isCompleted: true })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert('Event marked as completed!');
      fetchMyEvents(); // Refresh the list
    } catch (error) {
      console.error('Failed to complete event:', error);
      alert('Failed to complete event');
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Event Management Dashboard</h1>
          <p className="text-gray-300 mt-2">Manage your created events and select winners</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Created Events Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">
              My Created Events ({events.createdEvents?.length || 0})
            </h2>
          </div>

          {!events.createdEvents || events.createdEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-lg">No events created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.createdEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onEventClick={handleEventClick}
                  onCompleteEvent={handleCompleteEvent}
                  isCreator={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Participating Events Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">
            Events I'm Participating In ({events.participatingEvents?.length || 0})
          </h2>

          {!events.participatingEvents || events.participatingEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-lg">Not participating in any events</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.participatingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onEventClick={handleEventClick}
                  onCompleteEvent={handleCompleteEvent}
                  isCreator={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          onClose={() => setShowEventDetails(false)}
          onEventUpdated={fetchMyEvents}
        />
      )}
    </div>
  );
};

export default EventManagementPage;