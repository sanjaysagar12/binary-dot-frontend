'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target
} from 'lucide-react';

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

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const response = await fetch('https://api-avalink.portos.cloud/api/event/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Take first 3 events as featured
        setFeaturedEvents((data.data || []).slice(0, 3));
      } else {
        console.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = '/explore';
    } else {
      window.location.href = '/login';
    }
  };

  const handleExploreEvents = () => {
    window.location.href = '/event';
  };

  const handleCreateEvent = () => {
    if (isAuthenticated) {
      window.location.href = '/event/create';
    } else {
      window.location.href = '/auth/login';
    }
  };
  return (
    <div className="min-h-screen bg-[#161616]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100"
          style={{
            backgroundImage: `url('/Avalink.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed'
          }}
        />

        {/* Responsive overlay for better readability */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              <Badge className="inline-flex items-center space-x-2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 text-sm sm:text-base">
                <Sparkles className="w-4 h-4" />
                <span>The Future of Events</span>
              </Badge>

              <h1 className="text-5xl text-white sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
                Discover Amazing
                <span className="block">Events & Experiences</span>
              </h1>

              <p className="max-w-2xl sm:max-w-3xl mx-auto text-xl sm:text-2xl text-gray-200 leading-relaxed px-4 sm:px-0">
                Join a community of innovators, creators, and dreamers. Participate in exclusive events,
                win prizes, and connect with like-minded individuals from around the world.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0  ">
                <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-black/80 hover:bg-black/90 backdrop-blur-sm px-10 sm:px-14 py-5 sm:py-6 text-lg sm:text-2xl shadow-xl border border-white/10"
                >
                {isAuthenticated ? 'Explore Events' : 'Get Started'}
                </Button>

                <Button
                onClick={handleCreateEvent}
                variant="outline"
                size="lg"
                className="px-10 sm:px-14 py-5 sm:py-6 text-lg sm:text-2xl bg-[#E94042]/90 hover:bg-[#E94042] backdrop-blur-sm border-[#E94042] text-white shadow-xl"
                >
                Create Event
                </Button>
            </div>
          </div>
        </div>

        {/* Mobile-specific background adjustments */}
        <style jsx>{`
          @media (max-width: 768px) {
            section {
              background-attachment: scroll;
            }
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35"
          style={{
            backgroundImage: `url('/Avalink.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed'
          }}
        />
        
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="text-center space-y-12 sm:space-y-16">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                Why Choose Our Platform?
              </h2>
              <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-200 leading-relaxed">
                Experience the next generation of event discovery and participation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="text-center p-6 sm:p-8 bg-[#1D1D1D]/90 backdrop-blur-sm border border-white/10 hover:bg-[#1D1D1D]/95 transition-all duration-300">
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E94042] rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl text-white font-semibold">Trending Events</h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    Discover the hottest events and trending topics in your industry
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6 sm:p-8 bg-[#1D1D1D]/90 backdrop-blur-sm border border-white/10 hover:bg-[#1D1D1D]/95 transition-all duration-300">
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20  bg-[#E94042] rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl text-white font-semibold">Win Prizes</h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    Participate in competitions and win amazing prizes worth thousands
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6 sm:p-8 bg-[#1D1D1D]/90 backdrop-blur-sm border border-white/10 hover:bg-[#1D1D1D]/95 transition-all duration-300">
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20  bg-[#E94042] rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl text-white font-semibold">Global Community</h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    Connect with thousands of passionate individuals worldwide
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100"
          style={{
            backgroundImage: `url('/Avalink.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed'
          }}
        />
        
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="text-center space-y-12 sm:space-y-16">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                Featured Events
              </h2>
              <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-200 leading-relaxed">
                Don't miss out on these exciting upcoming events
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl text-gray-200">Loading featured events...</p>
              </div>
            ) : featuredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                {featuredEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-[#1D1D1D]/90 backdrop-blur-sm border border-white/10 p-0">
                    <div className="relative h-48 sm:h-56">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/400/250';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <Badge className="absolute top-4 right-4 bg-[#E94042] text-white">
                        Featured
                      </Badge>
                    </div>

                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-semibold text-white text-left">{event.title}</h3>
                        <p className="text-gray-300 line-clamp-2 text-left">{event.description}</p>

                      <div className="text-sm">
                        <div className="flex items-center space-x-1 text-gray-300">
                          <Users className="w-4 h-4" />
                          <span>{event._count.participants} participants</span>
                        </div>

                        {event.prizePool && (
                          <div className="flex items-center space-x-1 font-semibold text-green-400">
                            <DollarSign className="w-4 h-4" />
                            <span>{event.prizePool.toLocaleString()} AVAX</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => window.location.href = `/event/${event.id}`}
                        className="w-full bg-[#E94042] hover:bg-[#E94042]/90 text-white"
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto bg-[#1D1D1D]/90 backdrop-blur-sm border border-white/10 rounded-lg p-8">
                  <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    No Featured Events Yet
                  </h3>
                  <p className="text-gray-300 text-lg mb-6">
                    Be the first to create an exciting event for the community!
                  </p>
                  <Button
                    onClick={handleCreateEvent}
                    className="bg-[#E94042] hover:bg-[#E94042]/90 text-white"
                  >
                    Create First Event
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {featuredEvents.length > 0 && (
              <div className="text-center mt-12">
                <Button
                  onClick={handleExploreEvents}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg border-white text-black hover:bg-white hover:text-black backdrop-blur-sm"
                >
                  View All Events
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
          
            
            <div className="pt-6 border-gray-800 text-sm text-gray-500">
              <p>&copy; 2024 Event Platform. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}