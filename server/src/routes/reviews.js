// ============================================================
// Review Routes — /api/reviews
// Buyers can review completed orders. Sellers can reply.
// Rating updates are applied to SellerProfile after each review.
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('../services/notifications');

const prisma = new PrismaClient();

// ─── POST /api/reviews — Submit a review ─────────────────────
// Only buyers who have a COMPLETED order for the service can review
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating || !comment) {
      return res.status(400).json({ error: 'orderId, rating, and comment are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify the order belongs to this buyer and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Not your order' });
    if (order.status !== 'COMPLETED') return res.status(400).json({ error: 'Order must be completed before reviewing' });
    if (order.review) return res.status(400).json({ error: 'You already reviewed this order' });

    const review = await prisma.review.create({
      data: {
        orderId,
        buyerId: req.user.id,
        sellerId: order.sellerId,
        rating: parseInt(rating),
        comment,
      },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Recalculate seller's average rating
    await recalcSellerRating(order.sellerId);

    // Notify seller
    await createNotification(req.io, {
      userId: order.sellerId,
      type: 'NEW_REVIEW',
      title: 'New review received',
      body: `${req.user.name} left a ${rating}-star review`,
      link: `/orders/${orderId}`,
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/reviews/:id/reply — Seller replies ───────────
router.patch('/:id/reply', authenticate, async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: 'Reply text required' });

    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your review to reply to' });
    if (review.sellerReply) return res.status(400).json({ error: 'Already replied' });

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: { sellerReply: reply },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/reviews/seller/:sellerId ───────────────────────
router.get('/seller/:sellerId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { sellerId: req.params.sellerId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, avatar: true } },
          order: { select: { service: { select: { title: true } } } },
        },
      }),
      prisma.review.count({ where: { sellerId: req.params.sellerId } }),
    ]);

    res.json({ reviews, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

// ─── Helper: recalculate seller's average rating ──────────────
async function recalcSellerRating(sellerId) {
  const result = await prisma.review.aggregate({
    where: { sellerId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.sellerProfile.update({
    where: { userId: sellerId },
    data: {
      avgRating: result._avg.rating || 0,
      totalReviews: result._count.rating,
    },
  });
}

module.exports = router;
