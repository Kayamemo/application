// ============================================================
// Admin Routes — /api/admin
// All endpoints require ADMIN role.
// Provides: user management, order oversight, dispute resolution,
// platform stats, niche management.
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { createNotification } = require('../services/notifications');

const prisma = new PrismaClient();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// ─── GET /api/admin/stats — Platform overview ─────────────────
router.get('/stats', async (_req, res, next) => {
  try {
    const [
      totalUsers, totalSellers, totalBuyers,
      totalServices, totalOrders, totalRevenue,
      openDisputes, activeSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { platformFee: true } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.sellerProfile.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    ]);

    res.json({
      totalUsers,
      totalSellers,
      totalBuyers,
      totalServices,
      totalOrders,
      totalRevenue: totalRevenue._sum.platformFee || 0,
      openDisputes,
      activeSubscriptions,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true, avatar: true,
          isVerified: true, createdAt: true,
          sellerProfile: { select: { subscriptionStatus: true, avgRating: true, totalOrders: true } },
          _count: { select: { buyerOrders: true, sellerOrders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/users/:id/ban ───────────────────────────
router.patch('/users/:id/ban', async (req, res, next) => {
  try {
    const { reason } = req.body;
    // For MVP: deactivate all their services and flag them
    await prisma.$transaction([
      prisma.service.updateMany({ where: { sellerId: req.params.id }, data: { isActive: false } }),
    ]);
    // In production: add a "bannedAt" field to User and block login
    res.json({ message: `User ${req.params.id} banned. Reason: ${reason}` });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/orders ────────────────────────────────────
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ...(status && { status }) };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, email: true } },
          service: { select: { title: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/disputes ──────────────────────────────────
router.get('/disputes', async (req, res, next) => {
  try {
    const { status = 'OPEN', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where: { status },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              buyer: { select: { id: true, name: true, email: true } },
              seller: { select: { id: true, name: true, email: true } },
              service: { select: { title: true } },
            },
          },
        },
      }),
      prisma.dispute.count({ where: { status } }),
    ]);

    res.json({ disputes, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/disputes/:id/resolve ────────────────────
// resolution: 'buyer' (refund) | 'seller' (release payment)
router.patch('/disputes/:id/resolve', async (req, res, next) => {
  try {
    const { resolution, note } = req.body;
    if (!['buyer', 'seller'].includes(resolution)) {
      return res.status(400).json({ error: 'resolution must be "buyer" or "seller"' });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: req.params.id },
      include: { order: true },
    });
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    const newOrderStatus = resolution === 'buyer' ? 'REFUNDED' : 'COMPLETED';
    const disputeStatus = resolution === 'buyer' ? 'RESOLVED_BUYER' : 'RESOLVED_SELLER';

    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: req.params.id },
        data: {
          status: disputeStatus,
          resolution: note,
          resolvedAt: new Date(),
          resolvedBy: req.user.id,
        },
      }),
      prisma.order.update({
        where: { id: dispute.orderId },
        data: {
          status: newOrderStatus,
          ...(resolution === 'seller' && { escrowHeld: false, escrowReleasedAt: new Date() }),
        },
      }),
    ]);

    // Notify both parties
    await Promise.all([
      createNotification(req.io, {
        userId: dispute.order.buyerId,
        type: 'DISPUTE_RESOLVED',
        title: 'Dispute resolved',
        body: `Resolution: in favor of ${resolution}. ${note || ''}`,
        link: `/orders/${dispute.orderId}`,
      }),
      createNotification(req.io, {
        userId: dispute.order.sellerId,
        type: 'DISPUTE_RESOLVED',
        title: 'Dispute resolved',
        body: `Resolution: in favor of ${resolution}. ${note || ''}`,
        link: `/dashboard/orders/${dispute.orderId}`,
      }),
    ]);

    res.json({ message: `Dispute resolved in favor of ${resolution}` });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/settings ──────────────────────────────────
router.get('/settings', async (_req, res, next) => {
  try {
    const settings = await prisma.platformSetting.findMany();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/settings ────────────────────────────────
router.patch('/settings', async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
    res.json(setting);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/admin/geocode-services — backfill lat/lng ──────
router.post('/geocode-services', async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { location: { not: null }, lat: null },
      select: { id: true, location: true },
    });

    let updated = 0;
    for (const s of services) {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(s.location)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'Kaya-Marketplace/1.0' } }
        );
        const data = await r.json();
        if (data[0]) {
          await prisma.service.update({
            where: { id: s.id },
            data: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) },
          });
          updated++;
        }
        // Nominatim rate limit: 1 req/sec
        await new Promise((resolve) => setTimeout(resolve, 1100));
      } catch { /* skip individual failures */ }
    }

    res.json({ total: services.length, updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
