'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { getEventTypes, EventType } from '@/lib/api';

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const data = await getEventTypes();
        setEventTypes(data);
      } catch (err) {
        setError('Failed to load event types');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventTypes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-gray-600">Loading event types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
          <Link href="/">
            <Button className="touch-target">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Link 
              href="/" 
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 touch-target"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Back</span>
            </Link>
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <h1 className="text-lg sm:text-xl font-bold">Cal Clone</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">
              Select a Meeting Type
            </h2>
            <p className="text-base sm:text-lg text-gray-600 px-4">
              Choose the duration that works best for you
            </p>
          </div>

          {/* Event Types List */}
          <div className="space-y-3 sm:space-y-4">
            {eventTypes.map((eventType) => (
              <Card 
                key={eventType.id} 
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    {/* Event Info */}
                    <div className="flex-1">
                      <CardTitle className="text-xl sm:text-2xl mb-2">
                        {eventType.title}
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        {eventType.description || 'Schedule a meeting'}
                      </CardDescription>
                    </div>
                    
                    {/* Duration Badge */}
                    <div className="flex items-center gap-2 text-gray-600 self-start sm:ml-4">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                        {eventType.duration} min
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6 pt-0">
                  <Link href={`/book/${eventType.slug}`}>
                    <Button 
                      className="w-full touch-target text-sm sm:text-base" 
                      size="lg"
                    >
                      Book This Meeting
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {eventTypes.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-base sm:text-lg">
                No event types available
              </p>
              <Link href="/" className="inline-block mt-6">
                <Button variant="outline" className="touch-target">
                  Go Back Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
