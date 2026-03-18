// ============================================================
// Order Routes — /api/orders
// Status machine: PENDING → ACTIVE → DELIVERED → COMPLETED / DISPUTED
// Escrow is released automatically when buyer confirms completion.
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { createOrderPaymentIntent, releaseEscrow } = require('../services/stripe');
const { createNotification } = require('../services/notifications');

const prisma = new PrismaClient();

// ─── POST /api/orders — Place an order ───────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { serviceId, packageId, requirements, scheduledAt } = req.body;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        packages: true,
        seller: { include: { sellerProfile: true } },
      },
    });

    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (!service.isActive) return res.status(400).json({ error: 'Service is not available' });
    if (service.sellerId === req.user.id) return res.status(400).json({ error: 'You cannot order your own service' });

    // Verify seller has active subscription
    if (service.seller.sellerProfile?.subscriptionStatus !== 'ACTIVE') {
      return res.status(400).json({ error: 'This seller does not have an active subscription' });
    }

    // Determine price from package or base price
    let amount = parseFloat(service.basePrice);
    let deliveryDays = service.deliveryDays;
    if (packageId) {
      const pkg = service.packages.find((p) => p.id === packageId);
      if (!pkg) return res.status(400).json({ error: 'Package not found' });
      amount = parseFloat(pkg.price);
      deliveryDays = pkg.deliveryDays;
    }

    // Platform fee (default 10%)
    const feePct = parseFloat(
      (await prisma.platformSetting.findUnique({ where: { key: 'platform_fee_pct' } }))?.value || '10'
    );
    const platformFee = parseFloat((amount * (feePct / 100)).toFixed(2));
    const sellerEarnings = parseFloat((amount - platformFee).toFixed(2));

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + deliveryDays);

    // Create order (status=PENDING until payment confirmed via webhook)
    const order = await prisma.order.create({
      data: {
        buyerId: req.user.id,
        sellerId: service.sellerId,
        serviceId,
        packageId,
        amount,
        platformFee,
        sellerEarnings,
        deliveryDays,
        dueDate,
        requirements,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    // Create Stripe PaymentIntent
    const { paymentIntent } = await createOrderPaymentIntent(order, req.user.email);

    // Update order with PaymentIntent ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    // Create conversation for this order
    await prisma.conversation.upsert({
      where: {
        buyerId_sellerId_serviceId: {
          buyerId: req.user.id,
          sellerId: service.sellerId,
          serviceId,
        },
      },
      create: {
        buyerId: req.user.id,
        sellerId: service.sellerId,
        serviceId,
        orderId: order.id,
      },
      update: { orderId: order.id },
    });

    // Notify seller
    await createNotification(req.io, {
      userId: service.sellerId,
      type: 'NEW_ORDER',
      title: 'New order received!',
      body: `${req.user.name} ordered "${service.title}"`,
      link: `/dashboard/orders/${order.id}`,
    });

    res.status(201).json({
      order,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/orders — My orders (buyer or seller) ───────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { role = 'buyer', status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(role === 'buyer' ? { buyerId: req.user.id } : { sellerId: req.user.id }),
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { title: true, images: true } },
          package: { select: { name: true } },
          buyer: { select: { id: true, name: true, avatar: true } },
          seller: { select: { id: true, name: true, avatar: true } },
          review: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        service: { include: { niche: true } },
        package: true,
        buyer: { select: { id: true, name: true, avatar: true, email: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        review: { include: { buyer: { select: { name: true, avatar: true } } } },
        dispute: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Only buyer, seller, or admin can see the order
    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/orders/:id/deliver — Seller marks as delivered ─
router.patch('/:id/deliver', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your order' });
    if (order.status !== 'ACTIVE') return res.status(400).json({ error: 'Order must be ACTIVE to deliver' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });

    await createNotification(req.io, {
      userId: order.buyerId,
      type: 'ORDER_DELIVERED',
      title: 'Your order was delivered!',
      body: 'Review and confirm delivery to release payment.',
      link: `/orders/${order.id}`,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/orders/:id/complete — Buyer confirms delivery ─
router.patch('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Not your order' });
    if (order.status !== 'DELIVERED') return res.status(400).json({ error: 'Order must be DELIVERED to complete' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Release escrow — seller gets paid
    await releaseEscrow(order.id);

    // Update seller stats
    await prisma.sellerProfile.update({
      where: { userId: order.sellerId },
      data: { totalOrders: { increment: 1 } },
    });

    await createNotification(req.io, {
      userId: order.sellerId,
      type: 'ORDER_COMPLETED',
      title: 'Order completed & payment released!',
      body: `Earnings of $${order.sellerEarnings} are on their way.`,
      link: `/dashboard/orders/${order.id}`,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/orders/:id/dispute — Open a dispute ──────────
router.patch('/:id/dispute', authenticate, async (req, res, next) => {
  try {
    const { reason, evidence } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason required' });

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Not your order' });
    }
    if (!['ACTIVE', 'DELIVERED'].includes(order.status)) {
      return res.status(400).json({ error: 'Disputes can only be opened on ACTIVE or DELIVERED orders' });
    }

    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: 'DISPUTED' } }),
      prisma.dispute.create({
        data: {
          orderId: order.id,
          openedById: req.user.id,
          reason,
          evidence: evidence || [],
        },
      }),
    ]);

    res.json({ message: 'Dispute opened. An admin will review shortly.' });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/orders/:id/cancel ─────────────────────────────
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!['PENDING', 'ACTIVE'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    // TODO: Refund via Stripe if payment was captured

    res.json({ message: 'Order cancelled' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
