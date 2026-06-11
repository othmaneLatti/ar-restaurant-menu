"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
const eventSchema = zod_1.z.object({
    body: zod_1.z.object({
        restaurant_id: zod_1.z.string().uuid(),
        table_id: zod_1.z.string().uuid().optional().nullable(),
        event_type: zod_1.z.enum(['QR_SCAN', 'CATEGORY_OPEN', 'ITEM_VIEW', 'SESSION_END']),
        item_id: zod_1.z.string().uuid().optional().nullable(),
        category_id: zod_1.z.string().uuid().optional().nullable(),
        session_id: zod_1.z.string(),
        duration_ms: zod_1.z.number().optional().nullable(),
    }),
});
router.post('/event', (0, validate_1.validate)(eventSchema), async (req, res) => {
    try {
        await server_1.prisma.analyticsEvent.create({
            data: req.body,
        });
        res.json({ success: true });
    }
    catch (error) {
        // Fail silently so we don't break the client app
        console.error('Analytics error:', error);
        res.json({ success: false });
    }
});
router.get('/:restaurant_id', auth_1.authenticate, async (req, res) => {
    try {
        const restaurant_id = req.params.restaurant_id;
        const [scanCount, avgSession] = await Promise.all([
            server_1.prisma.analyticsEvent.count({
                where: { restaurant_id, event_type: 'QR_SCAN' },
            }),
            server_1.prisma.analyticsEvent.aggregate({
                where: { restaurant_id, event_type: 'SESSION_END' },
                _avg: { duration_ms: true },
            }),
        ]);
        // Group by for top items
        const topItems = await server_1.prisma.analyticsEvent.groupBy({
            by: ['item_id'],
            where: { restaurant_id, event_type: 'ITEM_VIEW', item_id: { not: null } },
            _count: { item_id: true },
            orderBy: { _count: { item_id: 'desc' } },
            take: 5,
        });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentScans = await server_1.prisma.analyticsEvent.findMany({
            where: {
                restaurant_id,
                event_type: 'QR_SCAN',
                created_at: { gte: sevenDaysAgo },
            },
            select: { created_at: true },
            orderBy: { created_at: 'asc' },
        });
        const scansByDayMap = {};
        recentScans.forEach(scan => {
            // Create YYYY-MM-DD string
            const dateStr = scan.created_at.toISOString().split('T')[0];
            scansByDayMap[dateStr] = (scansByDayMap[dateStr] || 0) + 1;
        });
        const eventsByDay = Object.keys(scansByDayMap).map(date => ({
            date,
            count: scansByDayMap[date],
        }));
        res.json({
            scan_count: scanCount,
            avg_session_ms: avgSession._avg.duration_ms || 0,
            top_items: topItems,
            events_by_day: eventsByDay,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
