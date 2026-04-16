'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, Mail, User, Globe, Eye, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { getBookings, cancelBooking, deleteBooking, type Booking } from '@/lib/api';
import { format } from 'date-fns';

// ============================================
// BOOKING DETAILS MODAL
// ============================================
function BookingDetailsModal({ 
  booking, 
  onClose, 
  onCancel, 
  onDelete 
}: { 
  booking: Booking; 
  onClose: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Booking Details</CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-gray-500 uppercase">Status</label>
            <div className="mt-1">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  booking.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="text-sm font-semibold text-gray-500 uppercase">Event Type</label>
            <p className="mt-1 text-lg font-medium">{booking.eventType?.title || 'Event'}</p>
            <p className="text-sm text-gray-500">{booking.eventType?.duration} minutes</p>
          </div>

          {/* Guest Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase">Guest Name</label>
              <p className="mt-1 text-gray-900">{booking.bookerName}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase">Email</label>
              <p className="mt-1 text-gray-900 break-all">{booking.bookerEmail}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase">Date</label>
              <p className="mt-1 text-gray-900">
                {format(new Date(booking.bookingDate), 'EEEE, MMMM dd, yyyy')}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase">Time</label>
              <p className="mt-1 text-gray-900">
                {booking.startTime} - {booking.endTime}
              </p>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="text-sm font-semibold text-gray-500 uppercase">Timezone</label>
            <p className="mt-1 text-gray-900">{booking.timezone}</p>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase">Guest Notes</label>
              <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-md">{booking.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t text-sm text-gray-500">
            <p>Booking ID: {booking.id}</p>
            <p>Created: {format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm')}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
            {booking.status === 'confirmed' && (
              <>
                <Button
                  onClick={onCancel}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              </>
            )}
            {booking.status === 'cancelled' && (
              <Button
                onClick={onDelete}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// CANCEL CONFIRMATION MODAL
// ============================================
function CancelConfirmationModal({ 
  booking, 
  onConfirm, 
  onCancel 
}: { 
  booking: Booking; 
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <XCircle className="h-6 w-6" />
            Cancel Booking?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel this booking with{' '}
            <strong>{booking.bookerName}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            {format(new Date(booking.bookingDate), 'EEEE, MMMM dd, yyyy')} at{' '}
            {booking.startTime}
          </p>
          <div className="flex gap-3 pt-2">
            <Button onClick={onCancel} variant="outline" className="flex-1">
              No, Keep It
            </Button>
            <Button onClick={onConfirm} variant="destructive" className="flex-1">
              Yes, Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================
function DeleteConfirmationModal({ 
  booking, 
  onConfirm, 
  onCancel 
}: { 
  booking: Booking; 
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Trash2 className="h-6 w-6" />
            Delete Booking?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to permanently delete this booking?
          </p>
          <p className="text-sm text-red-600 font-semibold">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <Button onClick={onCancel} variant="outline" className="flex-1">
              No, Keep It
            </Button>
            <Button onClick={onConfirm} variant="destructive" className="flex-1">
              Yes, Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// MAIN BOOKINGS CONTENT
// ============================================
function BookingsContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  
  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      console.log('📋 Fetching bookings...');
      const data = await getBookings();
      console.log('✅ Bookings received:', data);
      setBookings(data);
    } catch (err) {
      console.error('❌ Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') {
      return booking.status === 'confirmed' && bookingDate >= today;
    }
    if (filter === 'past') {
      return bookingDate < today;
    }
    if (filter === 'cancelled') {
      return booking.status === 'cancelled';
    }
    return true; // 'all'
  });

  // Count bookings by status
  const counts = {
    all: bookings.length,
    upcoming: bookings.filter(
      (b) => b.status === 'confirmed' && new Date(b.bookingDate) >= new Date()
    ).length,
    past: bookings.filter((b) => new Date(b.bookingDate) < new Date()).length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  // Handle cancel booking
  async function handleCancelBooking() {
    if (!selectedBooking) return;

    setActionLoading(true);
    try {
      await cancelBooking(selectedBooking.id);
      await fetchBookings(); // Refresh list
      setShowCancelModal(false);
      setShowDetailsModal(false);
      setSelectedBooking(null);
    } catch (err) {
      alert('Failed to cancel booking: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  }

  // Handle delete booking
  async function handleDeleteBooking() {
    if (!selectedBooking) return;

    setActionLoading(true);
    try {
      await deleteBooking(selectedBooking.id);
      await fetchBookings(); // Refresh list
      setShowDeleteModal(false);
      setShowDetailsModal(false);
      setSelectedBooking(null);
    } catch (err) {
      alert('Failed to delete booking: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  }

  // Success message after booking
  if (success === 'true') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your booking has been successfully created. You will receive a confirmation email shortly.
            </p>
            <div className="flex gap-3">
              <Link href="/bookings" className="flex-1">
                <Button variant="outline" className="w-full">
                  View All Bookings
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} variant="destructive" className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main bookings list
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Your Bookings</h1>
          <p className="mt-2 text-gray-600">
            {bookings.length === 0
              ? 'No bookings yet'
              : `${bookings.length} booking${bookings.length === 1 ? '' : 's'} found`}
          </p>
        </div>

        {/* Filter Tabs */}
        {bookings.length > 0 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All ({counts.all})
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setFilter('upcoming')}
              size="sm"
            >
              Upcoming ({counts.upcoming})
            </Button>
            <Button
              variant={filter === 'past' ? 'default' : 'outline'}
              onClick={() => setFilter('past')}
              size="sm"
            >
              Past ({counts.past})
            </Button>
            <Button
              variant={filter === 'cancelled' ? 'default' : 'outline'}
              onClick={() => setFilter('cancelled')}
              size="sm"
            >
              Cancelled ({counts.cancelled})
            </Button>
          </div>
        )}

        {/* Empty state */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <CardTitle className="text-xl mb-2">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </CardTitle>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? 'Get started by creating a new booking.'
                : `You don't have any ${filter} bookings.`}
            </p>
            {filter === 'all' ? (
              <Link href="/">
                <Button>Browse Event Types</Button>
              </Link>
            ) : (
              <Button onClick={() => setFilter('all')} variant="outline">
                View All Bookings
              </Button>
            )}
          </Card>
        ) : (
          /* Bookings grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  {/* Status badge and duration */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    {booking.eventType && (
                      <span className="text-xs text-gray-500 font-medium">
                        {booking.eventType.duration} min
                      </span>
                    )}
                  </div>

                  {/* Event title */}
                  <CardTitle className="text-lg">
                    {booking.eventType?.title || 'Event'}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Booker name */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{booking.bookerName}</span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{booking.bookerEmail}</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{format(new Date(booking.bookingDate), 'MMM dd, yyyy')}</span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      {booking.startTime} - {booking.endTime}
                    </span>
                  </div>

                  {/* Timezone */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-xs">{booking.timezone}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {booking.status === 'confirmed' && (
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowCancelModal(true);
                        }}
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  {/* Created date */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-400">
                      Booked on {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBooking(null);
          }}
          onCancel={() => {
            setShowDetailsModal(false);
            setShowCancelModal(true);
          }}
          onDelete={() => {
            setShowDetailsModal(false);
            setShowDeleteModal(true);
          }}
        />
      )}

      {showCancelModal && selectedBooking && (
        <CancelConfirmationModal
          booking={selectedBooking}
          onConfirm={handleCancelBooking}
          onCancel={() => {
            setShowCancelModal(false);
            setSelectedBooking(null);
          }}
        />
      )}

      {showDeleteModal && selectedBooking && (
        <DeleteConfirmationModal
          booking={selectedBooking}
          onConfirm={handleDeleteBooking}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// PAGE WRAPPER
// ============================================
export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BookingsContent />
    </Suspense>
  );
}
