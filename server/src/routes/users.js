// ============================================================
// User Routes — /api/users
// Profile management, becoming a seller
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

// ─── GET /api/users/:id — Public profile ─────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, avatar: true, bio: true, location: true,
        createdAt: true, role: true,
        sellerProfile: {
          select: {
            tagline: true, portfolioImages: true, skills: true,
            languages: true, responseTime: true, memberSince: true,
            avgRating: true, totalReviews: true, totalOrders: true,
            completionRate: true, subscriptionStatus: true,
          },
        },
        services: {
          where: { isActive: true },
          take: 6,
          select: {
            id: true, title: true, basePrice: true, images: true,
            niche: { select: { name: true, slug: true } },
          },
        },
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, rating: true, comment: true, createdAt: true,
            buyer: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/users/me — Update own profile ─────────────────
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, bio, location, avatar, tagline, portfolioImages, skills, languages, responseTime } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(avatar !== undefined && { avatar }),
      },
      select: { id: true, name: true, email: true, bio: true, location: true, avatar: true, role: true },
    });

    // Update seller profile fields if applicable
    if (req.user.role === 'SELLER') {
      await prisma.sellerProfile.upsert({
        where: { userId: req.user.id },
        create: {
          userId: req.user.id,
          tagline, portfolioImages, skills, languages, responseTime,
        },
        update: {
          ...(tagline !== undefined && { tagline }),
          ...(portfolioImages && { portfolioImages }),
          ...(skills && { skills }),
          ...(languages && { languages }),
          ...(responseTime !== undefined && { responseTime }),
        },
      });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/users/become-seller ───────────────────────────
// Upgrades a BUYER account to SELLER (creates SellerProfile + referral code)
router.post('/become-seller', authenticate, async (req, res, next) => {
  try {
    if (req.user.role === 'SELLER') {
      return res.status(400).json({ error: 'Already a seller' });
    }

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'SELLER' },
        select: { id: true, name: true, email: true, role: true },
      }),
      prisma.sellerProfile.create({
        data: {
          userId: req.user.id,
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // Generate a unique referral code for this new seller
    const referralCode = nanoid(8).toUpperCase();
    await prisma.referral.create({
      data: {
        referrerId: req.user.id,
        referredId: req.user.id, // placeholder — will be updated when someone uses it
        code: referralCode,
      },
    }).catch(() => {}); // Ignore if referral already exists

    res.json({ user, message: 'Account upgraded to seller. 14-day trial started.' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/me/notifications ─────────────────────────
router.get('/me/notifications', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/users/me/notifications/read — Mark all read ──
router.patch('/me/notifications/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
