import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const eventSchema = z.object({
  body: z.object({
    restaurant_id: z.string().uuid(),
    table_id: z.string().uuid().optional().nullable(),
    event_type: z.enum(['QR_SCAN', 'CATEGORY_OPEN', 'ITEM_VIEW', 'SESSION_END']),
    item_id: z.string().uuid().optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    session_id: z.string(),
    duration_ms: z.number().optional().nullable(),
  }),
});

router.post('/event', validate(eventSchema), async (req, res) => {
  try {
    await prisma.analyticsEvent.create({
      data: req.body,
    });
    res.json({ success: true });
  } catch (error) {
    // Fail silently so we don't break the client app
    console.error('Analytics error:', error);
    res.json({ success: false });
  }
});

router.get('/:restaurant_id', authenticate, async (req, res) => {
  try {
    const restaurant_id = req.params.restaurant_id;

    const [scanCount, avgSession] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { restaurant_id, event_type: 'QR_SCAN' },
      }),
      prisma.analyticsEvent.aggregate({
        where: { restaurant_id, event_type: 'SESSION_END' },
        _avg: { duration_ms: true },
      }),
    ]);

    // Group by for top items
    const topItems = await prisma.analyticsEvent.groupBy({
      by: ['item_id'],
      where: { restaurant_id, event_type: 'ITEM_VIEW', item_id: { not: null } },
      _count: { item_id: true },
      orderBy: { _count: { item_id: 'desc' } },
      take: 5,
    });
    
    // Convert BigInt to string before returning if using raw query
    // But since Prisma uses Number for count when using aggregate/groupBy, it's fine.
    const eventsByDay: any[] = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM "AnalyticsEvent"
      WHERE restaurant_id = ${restaurant_id}::uuid AND event_type = 'QR_SCAN'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
      LIMIT 7
    `;

    res.json({
      scan_count: scanCount,
      avg_session_ms: avgSession._avg.duration_ms || 0,
      top_items: topItems,
      events_by_day: eventsByDay,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
