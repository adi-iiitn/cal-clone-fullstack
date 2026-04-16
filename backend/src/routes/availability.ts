import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { 
  startOfDay, 
  endOfDay, 
  parseISO, 
  format, 
  addMinutes, 
  getDay 
} from 'date-fns';

const router = Router();

// Default user email (assuming logged-in user)
const DEFAULT_USER_EMAIL = 'demo@cal.com';

// Helper to get default user
async function getDefaultUser() {
  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
  });

  if (!user) {
    console.warn('⚠️ Default user not found, creating one...');
    user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: DEFAULT_USER_EMAIL,
        timezone: 'UTC',
      },
    });
  }

  return user;
}

// Get availability for default user (or specific user)
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📅 Fetching availability...');
    
    const user = await getDefaultUser();
    
    const availability = await prisma.availability.findMany({
      where: { userId: user.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    console.log(`✅ Found ${availability.length} availability rules`);
    res.json(availability);
  } catch (error) {
    console.error('❌ Error fetching availability:', error);
    res.status(500).json({ 
      error: 'Failed to fetch availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ⭐ Get available time slots for a specific event type and date
// MUST BE BEFORE /:userId route!
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const { eventTypeId, date } = req.query;

    console.log('🔍 Getting available slots...');
    console.log('Event Type ID:', eventTypeId);
    console.log('Date:', date);

    if (!eventTypeId || !date) {
      return res.status(400).json({ 
        error: 'Missing required parameters: eventTypeId, date' 
      });
    }

    // Get event type with user
    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId as string },
      include: { user: true },
    });

    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    // Parse the date
    const targetDate = parseISO(date as string);
    const dayOfWeek = getDay(targetDate); // 0=Sunday, 6=Saturday

    console.log('📅 Target date:', format(targetDate, 'yyyy-MM-dd'));
    console.log('📅 Day of week:', dayOfWeek, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]);
    console.log('👤 User ID:', eventType.userId);

    // Get availability for this day
    const availability = await prisma.availability.findUnique({
      where: {
        userId_dayOfWeek: {
          userId: eventType.userId,
          dayOfWeek,
        },
      },
    });

    console.log('🔍 Availability query result:', availability);

    if (!availability) {
      console.log('❌ No availability set for this day');
      return res.json({ slots: [] });
    }

    console.log('✅ Availability found:', {
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
    });

    // Generate time slots
    const slots: string[] = [];
    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);

    let currentTime = new Date(targetDate);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(targetDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Generate slots in 30-minute intervals
    while (currentTime < endTime) {
      const slotEndTime = addMinutes(currentTime, eventType.duration);
      
      // Only add slot if it fits within availability window
      if (slotEndTime <= endTime) {
        slots.push(format(currentTime, 'HH:mm'));
      }
      
      currentTime = addMinutes(currentTime, 30); // 30-minute intervals
    }

    console.log(`✅ Generated ${slots.length} potential slots`);

    // Get existing bookings for this date and event type
    const startOfDayDate = startOfDay(targetDate);
    const endOfDayDate = endOfDay(targetDate);

    const existingBookings = await prisma.booking.findMany({
      where: {
        eventTypeId: eventTypeId as string,
        bookingDate: {
          gte: startOfDayDate,
          lte: endOfDayDate,
        },
        status: 'confirmed',
      },
    });

    console.log(`📋 Found ${existingBookings.length} existing bookings for this date`);

    // Filter out booked slots (prevent double booking)
    const availableSlots = slots.filter((slot) => {
      const slotTime = parseISO(`${format(targetDate, 'yyyy-MM-dd')}T${slot}:00`);
      const slotEndTime = addMinutes(slotTime, eventType.duration);

      // Check if this slot conflicts with any existing booking
      const hasConflict = existingBookings.some((booking) => {
        const bookingStart = parseISO(`${format(new Date(booking.bookingDate), 'yyyy-MM-dd')}T${booking.startTime}:00`);
        const bookingEnd = parseISO(`${format(new Date(booking.bookingDate), 'yyyy-MM-dd')}T${booking.endTime}:00`);

        // ⭐ FIXED: Correct overlap detection
        // Two time ranges DON'T overlap only if:
        // - Slot ends before or at booking start, OR
        // - Slot starts at or after booking end
        // So overlap = NOT (slot ends <= booking start OR slot starts >= booking end)
        const noOverlap = (slotEndTime <= bookingStart || slotTime >= bookingEnd);
        const overlap = !noOverlap;

        if (overlap) {
          console.log(`⚠️ Slot ${slot} (${format(slotTime, 'HH:mm')}-${format(slotEndTime, 'HH:mm')}) conflicts with booking ${booking.startTime}-${booking.endTime}`);
        }

        return overlap;
      });

      return !hasConflict;
    });

    console.log(`✅ ${availableSlots.length} slots available after filtering booked times`);
    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('❌ Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

// Get availability for a specific user (by userId)
// MUST BE AFTER /slots route!
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    console.log('📅 Fetching availability for user:', userId);
    
    const availability = await prisma.availability.findMany({
      where: { userId },
      orderBy: { dayOfWeek: 'asc' },
    });
    
    console.log(`✅ Found ${availability.length} availability rules`);
    res.json(availability);
  } catch (error) {
    console.error('❌ Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Create or update single availability slot
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('💾 Creating/updating availability...');
    console.log('Request body:', req.body);

    const { userId, dayOfWeek, startTime, endTime, timezone } = req.body;

    // Validate
    if (!userId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, dayOfWeek, startTime, endTime' 
      });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ 
        error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' 
      });
    }

    const availability = await prisma.availability.upsert({
      where: {
        userId_dayOfWeek: { userId, dayOfWeek },
      },
      update: { startTime, endTime, timezone: timezone || 'UTC' },
      create: { userId, dayOfWeek, startTime, endTime, timezone: timezone || 'UTC' },
    });

    console.log('✅ Availability saved:', availability);
    res.json(availability);
  } catch (error) {
    console.error('❌ Error saving availability:', error);
    res.status(500).json({ error: 'Failed to save availability' });
  }
});

// Bulk update availability (set entire week at once)
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    console.log('💾 Bulk updating availability...');
    console.log('Request body:', req.body);

    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: 'availability must be an array' });
    }

    const user = await getDefaultUser();

    // Delete all existing availability for this user
    await prisma.availability.deleteMany({
      where: { userId: user.id },
    });

    console.log('🗑️ Deleted existing availability');

    // Create new availability settings
    if (availability.length > 0) {
      const created = await prisma.availability.createMany({
        data: availability.map((item: any) => ({
          userId: user.id,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          timezone: item.timezone || 'UTC',
        })),
      });

      console.log(`✅ Created ${created.count} availability rules`);
    }
    
    // Fetch and return all
    const allAvailability = await prisma.availability.findMany({
      where: { userId: user.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    res.json(allAvailability);
  } catch (error) {
    console.error('❌ Error bulk updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Delete availability slot
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    console.log('🗑️ Deleting availability:', id);

    await prisma.availability.delete({ where: { id } });

    console.log('✅ Availability deleted');
    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting availability:', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
});

export default router;
