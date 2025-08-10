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
      const response = await fetch('http://localhost:3000/api/event/all', {
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
      window.location.href = '/event';
    } else {
      window.location.href = '/auth/login';
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge className="inline-flex items-center space-x-2 bg-black text-white px-4 py-2">
                <Sparkles className="w-4 h-4" />
                <span>The Future of Events</span>
              </Badge>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                Discover Amazing
                <span className="block">Events & Experiences</span>
              </h1>
              
              <p className="max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed">
                Join a community of innovators, creators, and dreamers. Participate in exclusive events, 
                win prizes, and connect with like-minded individuals from around the world.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-black hover:bg-gray-800 px-8 py-4 text-lg"
              >
                {isAuthenticated ? 'Explore Events' : 'Get Started'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                onClick={handleCreateEvent}
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg"
              >
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Why Choose Our Platform?</h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              Experience the next generation of event discovery and participation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Trending Events</h3>
                <p className="text-muted-foreground">
                  Discover the hottest events and trending topics in your industry
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Win Prizes</h3>
                <p className="text-muted-foreground">
                  Participate in competitions and win amazing prizes worth thousands
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Global Community</h3>
                <p className="text-muted-foreground">
                  Connect with thousands of passionate individuals worldwide
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Featured Events</h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              Don't miss out on these exciting upcoming events
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-gray-600">Loading featured events...</p>
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <img 
                      src={event.image } 
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/400/250';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge className="absolute top-4 right-4 bg-black text-white">
                      Featured
                    </Badge>
                  </div>
                  
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-semibold">{event.title}</h3>
                    <p className="text-muted-foreground line-clamp-2">{event.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{event._count.participants} participants</span>
                      </div>
                      
                      {event.prizePool && (
                        <div className="flex items-center space-x-1 font-semibold text-green-600">
                          <DollarSign className="w-4 h-4" />
                          <span>${event.prizePool.toLocaleString()} prizes</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => window.location.href = `/event/${event.id}`}
                      className="w-full bg-black hover:bg-gray-800"
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                  No Featured Events Yet
                </h3>
                <p className="text-gray-500 text-lg mb-6">
                  Be the first to create an exciting event for the community!
                </p>
                <Button 
                  onClick={handleCreateEvent}
                  className="bg-black hover:bg-gray-800"
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
                className="px-8"
              >
                View All Events
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Start Your Journey?
          </h2>
          
          <p className="text-xl text-gray-300 leading-relaxed">
            Join thousands of participants who are already discovering amazing events, 
            winning prizes, and building meaningful connections.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              variant="secondary"
              className="px-8 py-4 text-lg bg-white text-black hover:bg-gray-100"
            >
              {isAuthenticated ? 'Explore Events' : 'Sign Up Now'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              onClick={handleExploreEvents}
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-black"
            >
              Browse Events
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}