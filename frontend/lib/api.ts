// lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface EventType {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  bookerName: string;
  bookerEmail: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  notes: string | null;
  status: string;
  createdAt: string;
  cancelledAt: string | null;
  eventType?: EventType;
}

export interface Availability {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  createdAt: string;
}

// ⭐ NEW: Response type for available slots
export interface AvailableSlotsResponse {
  slots: string[];
}

// ==================== EVENT TYPES ====================

// Get event type by slug
export async function getEventTypeBySlug(slug: string): Promise<EventType> {
  console.log(`📡 Fetching event type by slug: ${slug}`);
  console.log(`API URL: ${API_BASE_URL}/event-types/slug/${slug}`);
  
  const response = await fetch(`${API_BASE_URL}/event-types/slug/${slug}`);
  
  if (!response.ok) {
    console.error('❌ Failed to fetch event type:', response.status);
    throw new Error('Failed to fetch event type');
  }
  
  const data = await response.json();
  console.log('✅ Event type fetched:', data);
  return data;
}

// Get all event types
export async function getEventTypes(): Promise<EventType[]> {
  console.log('📋 Fetching all event types...');
  console.log('API URL:', `${API_BASE_URL}/event-types`);
  
  const response = await fetch(`${API_BASE_URL}/event-types`);
  
  if (!response.ok) {
    console.error('❌ Failed to fetch event types:', response.status);
    throw new Error('Failed to fetch event types');
  }
  
  const data = await response.json();
  console.log('✅ Event types fetched:', data.length, 'types');
  return data;
}

// ==================== AVAILABILITY ====================

// Get availability settings
export async function getAvailability(): Promise<Availability[]> {
  console.log('📅 Fetching availability settings...');
  console.log('API URL:', `${API_BASE_URL}/availability`);
  
  const response = await fetch(`${API_BASE_URL}/availability`);
  
  if (!response.ok) {
    console.error('❌ Failed to fetch availability:', response.status);
    throw new Error('Failed to fetch availability');
  }
  
  const data = await response.json();
  console.log('✅ Availability fetched:', data.length, 'rules');
  return data;
}

// Bulk update availability (set entire week)
export async function updateAvailability(availability: Array<{
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone?: string;
}>): Promise<Availability[]> {
  console.log('💾 Updating availability...');
  console.log('API URL:', `${API_BASE_URL}/availability/bulk`);
  console.log('Data:', availability);
  
  const response = await fetch(`${API_BASE_URL}/availability/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ availability }),
  });
  
  if (!response.ok) {
    console.error('❌ Failed to update availability:', response.status);
    const error = await response.json();
    throw new Error(error.error || 'Failed to update availability');
  }
  
  const data = await response.json();
  console.log('✅ Availability updated:', data.length, 'rules');
  return data;
}

// ⭐ UPDATED: Get available time slots for a specific date
export async function getAvailableSlots(
  eventTypeId: string, 
  date: string
): Promise<AvailableSlotsResponse> {
  console.log(`📅 Fetching available slots for event ${eventTypeId} on ${date}`);
  console.log(`API URL: ${API_BASE_URL}/availability/slots?eventTypeId=${eventTypeId}&date=${date}`);
  
  const response = await fetch(`${API_BASE_URL}/availability/slots?eventTypeId=${eventTypeId}&date=${date}`);
  
  if (!response.ok) {
    console.warn('⚠️ Availability endpoint failed, using mock data');
    return { slots: generateMockSlots() };
  }
  
  const data = await response.json();
  console.log('✅ Available slots:', data.slots || data);
  
  // Handle both formats: { slots: [...] } or just [...]
  if (Array.isArray(data)) {
    return { slots: data };
  }
  
  return data as AvailableSlotsResponse;
}

// Mock slots generator (fallback only)
function generateMockSlots(): string[] {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  console.log('🔧 Generated mock slots:', slots.length, 'slots');
  return slots;
}

// ==================== BOOKINGS ====================

// Create a booking
export async function createBooking(data: {
  eventTypeId: string;
  name: string;
  email: string;
  startTime: string;
  endTime: string;
  timezone: string;
  notes?: string;
}): Promise<Booking> {
  console.log('=== 📝 Creating Booking ===');
  console.log('API URL:', `${API_BASE_URL}/bookings`);
  console.log('Request data:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (!response.ok) {
      console.error('❌ Booking failed:', responseData);
      throw new Error(responseData.error || responseData.details || 'Failed to create booking');
    }
    
    console.log('✅ Booking created successfully!');
    return responseData;
  } catch (error) {
    console.error('❌ Fetch error:', error);
    throw error;
  }
}

// Get all bookings
export async function getBookings(): Promise<Booking[]> {
  console.log('📋 Fetching all bookings...');
  console.log('API URL:', `${API_BASE_URL}/bookings`);
  
  const response = await fetch(`${API_BASE_URL}/bookings`);
  
  if (!response.ok) {
    console.error('❌ Failed to fetch bookings:', response.status);
    throw new Error('Failed to fetch bookings');
  }
  
  const data = await response.json();
  console.log('✅ Bookings fetched:', data.length, 'bookings');
  return data;
}

// ============================================
// BOOKING ACTIONS
// ============================================

// Get single booking by ID
export async function getBooking(id: string): Promise<Booking> {
  console.log('📋 Fetching booking:', id);
  console.log('API URL:', `${API_BASE_URL}/bookings/${id}`);
  
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`);
  
  if (!response.ok) {
    console.error('❌ Failed to fetch booking:', response.status);
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch booking');
  }
  
  const data = await response.json();
  console.log('✅ Booking fetched:', data);
  return data;
}

// Cancel a booking
export async function cancelBooking(bookingId: string): Promise<Booking> {
  console.log('❌ Cancelling booking:', bookingId);
  console.log('API URL:', `${API_BASE_URL}/bookings/${bookingId}/cancel`);
  
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    console.error('❌ Failed to cancel booking:', response.status);
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel booking');
  }
  
  const data = await response.json();
  console.log('✅ Booking cancelled:', data);
  return data;
}

// Reschedule a booking
export async function rescheduleBooking(
  id: string,
  data: {
    bookingDate: string;
    startTime: string;
    endTime: string;
  }
): Promise<Booking> {
  console.log('📅 Rescheduling booking:', id);
  console.log('API URL:', `${API_BASE_URL}/bookings/${id}/reschedule`);
  console.log('New time:', data);
  
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/reschedule`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    console.error('❌ Failed to reschedule booking:', response.status);
    const error = await response.json();
    throw new Error(error.error || 'Failed to reschedule booking');
  }
  
  const data_response = await response.json();
  console.log('✅ Booking rescheduled:', data_response);
  return data_response;
}

// Delete a booking (hard delete)
export async function deleteBooking(id: string): Promise<{ message: string }> {
  console.log('🗑️ Deleting booking:', id);
  console.log('API URL:', `${API_BASE_URL}/bookings/${id}`);
  
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    console.error('❌ Failed to delete booking:', response.status);
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete booking');
  }
  
  const data = await response.json();
  console.log('✅ Booking deleted:', data);
  return data;
}
