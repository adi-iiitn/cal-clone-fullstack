import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { addMinutes, parseISO, format, startOfDay, endOfDay } from 'date-fns';
import { sendBookingConfirmation, sendCancellationEmail } from '../services/emailService';

const router = Router();

// Create a booking (with email notification)
router.post('/', async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('=== 📝 NEW BOOKING REQUEST ===');
    console.log('========================================');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { eventTypeId, name, email, startTime, endTime, timezone, notes } = req.body;

    // Validate required fields
    if (!eventTypeId || !name || !email || !startTime || !timezone) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: eventTypeId, name, email, startTime, timezone' 
      });
    }

    console.log('\n📅 Step 1: Parsing startTime:', startTime);
    console.log('Timezone:', timezone);
    
    // Parse the startTime (already in correct timezone from frontend)
    const startDateTime = new Date(startTime);
    
    if (isNaN(startDateTime.getTime())) {
      console.error('❌ Invalid startTime format:', startTime);
      return res.status(400).json({ error: 'Invalid startTime format' });
    }

    console.log('✅ Parsed start time (local):', startDateTime.toLocaleString());
    console.log('✅ Parsed start time (ISO):', startDateTime.toISOString());

    // Get event type
    console.log('\n📋 Step 2: Fetching event type...');
    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
    });

    if (!eventType) {
      console.error('❌ Event type not found:', eventTypeId);
      return res.status(404).json({ error: 'Event type not found' });
    }

    console.log('✅ Event type found:', eventType.title, '- Duration:', eventType.duration, 'minutes');

    // Calculate end time
    let endDateTime: Date;
    
    if (endTime) {
      endDateTime = new Date(endTime);
    } else {
      endDateTime = addMinutes(startDateTime, eventType.duration);
    }

    console.log('✅ End time (local):', endDateTime.toLocaleString());
    console.log('✅ End time (ISO):', endDateTime.toISOString());

    // ⭐ CRITICAL FIX: Use the original datetime for date extraction
    // Don't use startOfDay which converts to UTC midnight
    const year = startDateTime.getFullYear();
    const month = String(startDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(startDateTime.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Create a date object for the booking date (no time component)
    const bookingDate = new Date(`${dateString}T00:00:00.000Z`);
    
    const startTimeStr = format(startDateTime, 'HH:mm');
    const endTimeStr = format(endDateTime, 'HH:mm');

    console.log('\n💾 Step 3: Prepared database values:');
    console.log('  - Original date from startDateTime:', startDateTime.toDateString());
    console.log('  - Extracted dateString:', dateString);
    console.log('  - bookingDate (for DB):', bookingDate.toISOString());
    console.log('  - startTime:', startTimeStr);
    console.log('  - endTime:', endTimeStr);

    // ⭐ Check for existing bookings
    console.log('\n🔍 Step 4: Checking for conflicts...');
    
    const existingBookings = await prisma.booking.findMany({
      where: {
        eventTypeId,
        bookingDate: bookingDate,
        status: 'confirmed',
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    console.log(`\n📋 Found ${existingBookings.length} existing confirmed booking(s) for ${dateString}`);

    if (existingBookings.length > 0) {
      console.log('\nExisting bookings:');
      existingBookings.forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.startTime} - ${b.endTime} | ${b.bookerName}`);
      });
    }

    // Check for time conflicts
    let conflictFound = false;
    let conflictingBooking = null;

    console.log('\n🔍 Step 5: Checking time overlaps...');
    console.log(`New booking request: ${startTimeStr} - ${endTimeStr}`);

    for (const booking of existingBookings) {
      console.log(`\n  Checking against: ${booking.startTime} - ${booking.endTime}`);
      
      // Reconstruct full datetime from stored date + time strings
      const existingStartStr = `${dateString}T${booking.startTime}:00`;
      const existingEndStr = `${dateString}T${booking.endTime}:00`;
      
      const existingStart = new Date(existingStartStr);
      const existingEnd = new Date(existingEndStr);

      // Check overlap
      const newStartsBeforeExistingEnds = startDateTime < existingEnd;
      const newEndsAfterExistingStarts = endDateTime > existingStart;
      const overlap = newStartsBeforeExistingEnds && newEndsAfterExistingStarts;

      console.log(`    New starts before existing ends? ${newStartsBeforeExistingEnds}`);
      console.log(`    New ends after existing starts? ${newEndsAfterExistingStarts}`);
      console.log(`    OVERLAP? ${overlap ? '❌ YES' : '✅ NO'}`);

      if (overlap) {
        conflictFound = true;
        conflictingBooking = booking;
        console.log(`\n  ⚠️⚠️⚠️ CONFLICT DETECTED! ⚠️⚠️⚠️`);
        break;
      }
    }

    if (conflictFound) {
      console.log('\n❌❌❌ BOOKING REJECTED ❌❌❌');
      console.log('Reason: Time slot already booked');
      console.log('========================================\n');
      
      return res.status(409).json({ 
        error: 'This time slot is already booked. Please choose another time.',
        conflictingTime: `${conflictingBooking?.startTime} - ${conflictingBooking?.endTime}`,
      });
    }

    console.log('\n✅ Step 6: No conflicts found - creating booking...');

    // Create booking
    const bookingData = {
      eventTypeId,
      bookerName: name,
      bookerEmail: email,
      bookingDate,           // Date component only
      startTime: startTimeStr,  // "10:00"
      endTime: endTimeStr,      // "10:30"
      timezone,
      notes: notes || null,
      status: 'confirmed',
    };

    console.log('\n💾 Creating booking:');
    console.log('  Date:', dateString);
    console.log('  Time:', startTimeStr, '-', endTimeStr);
    console.log('  Name:', name);

    const booking = await prisma.booking.create({
      data: bookingData,
      include: {
        eventType: true,
      },
    });

    console.log('\n✅✅✅ BOOKING CREATED ✅✅✅');
    console.log('  ID:', booking.id);
    console.log('  Date in DB:', new Date(booking.bookingDate).toISOString());
    console.log('  Time:', booking.startTime, '-', booking.endTime);
    console.log('========================================\n');

    // Send email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      sendBookingConfirmation(booking, eventType)
        .then(() => console.log('✅ Email sent'))
        .catch((err) => console.error('⚠️ Email failed:', err.message));
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.log('========================================\n');
    
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to create booking',
        details: error.message,
      });
    } else {
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
});

// Get all bookings
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all bookings...');
    const bookings = await prisma.booking.findMany({
      include: {
        eventType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`✅ Found ${bookings.length} bookings`);
    res.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { eventType: true },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Cancel booking
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { eventType: true },
    });
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
      include: { eventType: true },
    });
    if (booking.eventType && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      sendCancellationEmail(booking, booking.eventType)
        .then(() => console.log('✅ Cancellation email sent'))
        .catch((err) => console.error('⚠️ Email failed:', err.message));
    }
    res.json(booking);
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    await prisma.booking.delete({ where: { id } });
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;
