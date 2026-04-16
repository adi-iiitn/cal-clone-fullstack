'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, User, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { getEventTypeBySlug, getAvailableSlots, createBooking, EventType } from '@/lib/api';
import { format, addDays } from 'date-fns';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch event type
  useEffect(() => {
    const fetchEventType = async () => {
      try {
        console.log('📋 Fetching event type:', slug);
        const data = await getEventTypeBySlug(slug);
        console.log('✅ Event type loaded:', data);
        setEventType(data);
      } catch (err) {
        setError('Event type not found');
        console.error('❌ Error loading event type:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventType();
  }, [slug]);

  // Fetch available slots when date or eventType changes
  useEffect(() => {
    if (eventType && selectedDate) {
      fetchSlots();
    }
  }, [selectedDate, eventType]);

  // Auto-refresh slots every 30 seconds
  useEffect(() => {
    if (!selectedDate || !eventType) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing available slots...');
      fetchSlots();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedDate, eventType]);

  const fetchSlots = async () => {
    if (!eventType) return;

    setLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('🔍 Fetching slots for:', dateStr);
      const response = await getAvailableSlots(eventType.id, dateStr);
      
      // Handle both array and object response formats
      const slots = Array.isArray(response) ? response : (response.slots || []);
      console.log('✅ Available slots:', slots);
      
      setAvailableSlots(slots);
      
      // Clear selected slot if it's no longer available
      if (selectedSlot && !slots.includes(selectedSlot)) {
        console.log('⚠️ Previously selected time is no longer available');
        setSelectedSlot('');
      }
    } catch (err) {
      console.error('❌ Failed to fetch slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const refreshSlots = async () => {
    setRefreshing(true);
    try {
      await fetchSlots();
    } finally {
      setRefreshing(false);
    }
  };

  // Generate next 7 days for date selection
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(new Date(), i));
    }
    return days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType || !selectedSlot) return;

    setSubmitting(true);
    setError('');

    try {
      console.log('=== 📝 Submitting Booking ===');
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startTime = `${dateStr}T${selectedSlot}:00`;
      
      console.log('Booking data:', {
        eventTypeId: eventType.id,
        name: formData.name,
        email: formData.email,
        startTime,
        selectedDate: dateStr,
        selectedSlot,
      });

      // Calculate end time from event duration
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + eventType.duration * 60000);
      const endTime = endDate.toISOString();

      await createBooking({
        eventTypeId: eventType.id,
        name: formData.name,
        email: formData.email,
        startTime,
        endTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: formData.notes || undefined,
      });

      console.log('✅ Booking created successfully!');

      // Redirect to success page
      router.push('/bookings?success=true');
    } catch (err) {
      console.error('❌ Booking failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking. Please try again.';
      setError(errorMessage);
      
      // Refresh available slots after error (slot might be taken)
      console.log('🔄 Refreshing slots after error...');
      await fetchSlots();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !eventType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/event-types">
            <Button className="touch-target">Back to Event Types</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!eventType) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Link 
              href="/event-types" 
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
        <div className="max-w-5xl mx-auto">
          {/* Event Type Info */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
              {eventType.title}
            </h2>
            <div className="flex items-center gap-3 sm:gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">{eventType.duration} minutes</span>
              </div>
            </div>
            {eventType.description && (
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
                {eventType.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column - Date & Time Selection */}
            <div className="order-1">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Select Date & Time</CardTitle>
                  <CardDescription className="text-sm">
                    Choose your preferred date and time slot
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {/* Date Selection */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-sm sm:text-base text-gray-900">
                      Select a Date
                    </h3>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {getNext7Days().map((date) => (
                        <button
                          key={date.toISOString()}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlot(''); // Reset selected slot when date changes
                          }}
                          className={`p-1.5 sm:p-2 text-center rounded-lg border transition-colors touch-target ${
                            format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="text-[10px] sm:text-xs">{format(date, 'EEE')}</div>
                          <div className="text-sm sm:text-lg font-semibold">{format(date, 'd')}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                        Available Times
                      </h3>
                      <button
                        type="button"
                        onClick={refreshSlots}
                        disabled={refreshing || loadingSlots}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50 touch-target"
                        title="Refresh available slots"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing || loadingSlots ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-gray-600 mb-3">
                      {format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                    
                    {loadingSlots ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading available times...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 sm:max-h-80 overflow-y-auto">
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-2.5 sm:p-3 text-center rounded-lg border transition-colors text-sm sm:text-base touch-target ${
                                selectedSlot === slot
                                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                  : 'bg-white hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              {slot}
                            </button>
                          ))
                        ) : (
                          <div className="col-span-2 sm:col-span-3 text-center py-6 sm:py-8">
                            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No available slots for this date</p>
                            <p className="text-gray-400 text-xs mt-1">Please select another date</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Booking Form */}
            <div className="order-2">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Your Information</CardTitle>
                  <CardDescription className="text-sm">
                    Enter your details to complete the booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        <User className="inline h-4 w-4 mr-1" />
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base touch-target"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base touch-target"
                        placeholder="john@example.com"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        <MessageSquare className="inline h-4 w-4 mr-1" />
                        Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
                        rows={3}
                        placeholder="Any additional information..."
                      />
                    </div>

                    {/* Selected Time Summary */}
                    {selectedSlot && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                          Selected Time:
                        </p>
                        <p className="text-sm sm:text-base text-blue-800">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedSlot}
                        </p>
                        <p className="text-xs sm:text-sm text-blue-600 mt-1">
                          Duration: {eventType.duration} minutes
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                        <button
                          type="button"
                          onClick={refreshSlots}
                          className="text-xs text-red-700 hover:text-red-900 mt-2 underline"
                        >
                          Refresh available slots
                        </button>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full touch-target text-base sm:text-lg py-5 sm:py-6"
                      size="lg"
                      disabled={!selectedSlot || submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Booking...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </Button>

                    {!selectedSlot && (
                      <p className="text-xs sm:text-sm text-gray-500 text-center">
                        Please select a date and time slot above
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
