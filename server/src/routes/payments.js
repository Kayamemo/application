// ============================================================
// Payment Routes — /api/payments
// Stripe webhook handler + seller subscription management
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const {
  stripe,
  createSellerSubscription,
  cancelSellerSubscription,
  handleWebhookEvent,
} = require('../services/stripe');

const prisma = new PrismaClient();

// ─── POST /api/payments/webhook ───────────────────────────────
// Raw body is required (configured in index.js BEFORE json middleware)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─── POST /api/payments/subscribe — Start seller subscription ─
router.post('/subscribe', authenticate, requireRole('SELLER'), async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId required' });

    const subscription = await createSellerSubscription(req.user.id, paymentMethodId);
    res.json({ subscription });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/payments/cancel-subscription ───────────────────
router.post('/cancel-subscription', authenticate, requireRole('SELLER'), async (req, res, next) => {
  try {
    const subscription = await cancelSellerSubscription(req.user.id);
    res.json({ message: 'Subscription will cancel at end of billing period', subscription });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/payments/subscription ──────────────────────────
router.get('/subscription', authenticate, requireRole('SELLER'), async (req, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      select: {
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
      },
    });

    if (!profile) return res.status(404).json({ error: 'Seller profile not found' });

    // Fetch live data from Stripe if subscription exists
    let stripeData = null;
    if (profile.stripeSubscriptionId) {
      stripeData = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
    }

    res.json({ profile, stripeData });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/payments/portal — Stripe billing portal ────────
// Allows seller to manage billing, update card, download invoices
router.post('/portal', authenticate, requireRole('SELLER'), async (req, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
      select: { stripeCustomerId: true },
    });

    if (!profile?.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard/seller`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/payments/earnings ───────────────────────────────
// Seller earnings summary
router.get('/earnings', authenticate, requireRole('SELLER'), async (req, res, next) => {
  try {
    const [total, pending, completed] = await Promise.all([
      prisma.order.aggregate({
        where: { sellerId: req.user.id, status: { in: ['ACTIVE', 'DELIVERED', 'COMPLETED'] } },
        _sum: { sellerEarnings: true },
      }),
      prisma.order.aggregate({
        where: { sellerId: req.user.id, escrowHeld: true, status: { in: ['ACTIVE', 'DELIVERED'] } },
        _sum: { sellerEarnings: true },
      }),
      prisma.order.aggregate({
        where: { sellerId: req.user.id, escrowHeld: false, status: 'COMPLETED' },
        _sum: { sellerEarnings: true },
      }),
    ]);

    res.json({
      totalEarnings: total._sum.sellerEarnings || 0,
      pendingEarnings: pending._sum.sellerEarnings || 0,
      releasedEarnings: completed._sum.sellerEarnings || 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
