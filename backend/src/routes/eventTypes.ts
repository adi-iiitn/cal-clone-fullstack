import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all event types
router.get('/', async (req, res) => {
  try {
    const eventTypes = await prisma.eventType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(eventTypes);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

// Get event type by slug (MUST come before /:id route)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const eventType = await prisma.eventType.findUnique({
      where: { slug },
    });

    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    res.json(eventType);
  } catch (error) {
    console.error('Error fetching event type:', error);
    res.status(500).json({ error: 'Failed to fetch event type' });
  }
});

// Get event type by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const eventType = await prisma.eventType.findUnique({
      where: { id },
    });

    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    res.json(eventType);
  } catch (error) {
    console.error('Error fetching event type:', error);
    res.status(500).json({ error: 'Failed to fetch event type' });
  }
});

export default router;
