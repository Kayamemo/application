// ============================================================
// Stripe Service
// Handles subscriptions (sellers) and escrow payments (orders).
//
// Escrow flow:
//   1. Buyer pays → PaymentIntent captured → funds held
//   2. Buyer confirms delivery → releaseEscrow() → seller paid
//   3. Dispute → funds held until admin resolves
// ============================================================
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const stripeConfigured = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder');
const stripe = stripeConfigured ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const prisma = new PrismaClient();

// ─── Subscription helpers ─────────────────────────────────────

/**
 * Create or retrieve a Stripe customer for the given user,
 * then start a monthly seller subscription.
 */
async function createSellerSubscription(userId, paymentMethodId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Create or retrieve Stripe customer
  let customerId = await prisma.sellerProfile
    .findUnique({ where: { userId } })
    .then((p) => p?.stripeCustomerId);

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    customerId = customer.id;
  } else {
    // Attach new payment method to existing customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  // Create subscription ($7/month)
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_SELLER_PRICE_ID }],
    expand: ['latest_invoice.payment_intent'],
  });

  // Update seller profile
  await prisma.sellerProfile.update({
    where: { userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'TRIALING',
    },
  });

  return subscription;
}

/**
 * Cancel a seller's Stripe subscription at period end.
 */
async function cancelSellerSubscription(userId) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile?.stripeSubscriptionId) throw new Error('No active subscription');

  const subscription = await stripe.subscriptions.update(profile.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.sellerProfile.update({
    where: { userId },
    data: { subscriptionStatus: 'CANCELLED' },
  });

  return subscription;
}

// ─── Order / Escrow helpers ───────────────────────────────────

/**
 * Create a PaymentIntent for an order.
 * capture_method: 'automatic' → Stripe captures immediately.
 * The money is "held" in Stripe — we don't transfer it to the seller
 * until the order is COMPLETED.
 *
 * Note: For full escrow with payouts, set up Stripe Connect.
 * For MVP, we track manually and handle payouts separately.
 */
async function createOrderPaymentIntent(order, buyerEmail) {
  const platformFeePct = parseFloat(
    (await prisma.platformSetting.findUnique({ where: { key: 'platform_fee_pct' } }))?.value || '10'
  );
  const amount = Math.round(parseFloat(order.amount) * 100); // cents
  const platformFee = Math.round(amount * (platformFeePct / 100));

  // If Stripe not configured, return a mock client secret so the order still saves
  if (!stripe) {
    return { paymentIntent: { id: `mock_pi_${order.id}`, client_secret: `mock_secret_${order.id}` }, platformFee: platformFee / 100 };
  }

  // Retrieve or create Stripe customer for buyer
  let customer;
  const user = await prisma.user.findUnique({ where: { id: order.buyerId } });
  if (user.stripeCustomerId) {
    customer = user.stripeCustomerId;
  } else {
    const c = await stripe.customers.create({ email: buyerEmail, name: user.name });
    customer = c.id;
    await prisma.user.update({ where: { id: order.buyerId }, data: { stripeCustomerId: c.id } });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer,
    metadata: {
      orderId: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      platformFee,
    },
    description: `Kaya order #${order.id}`,
  });

  return { paymentIntent, platformFee: platformFee / 100 };
}

/**
 * After an order is marked COMPLETED, we record the escrow release.
 * In a production setup with Stripe Connect, you would call:
 *   stripe.transfers.create({ amount: sellerEarnings, destination: sellerStripeAccountId })
 *
 * For MVP: mark the order as escrow released and queue a payout review.
 */
async function releaseEscrow(orderId) {
  await prisma.order.update({
    where: { id: orderId },
    data: { escrowHeld: false, escrowReleasedAt: new Date() },
  });
  // TODO: trigger Stripe Connect transfer here in production
}

// ─── Webhook handler ──────────────────────────────────────────

/**
 * Process verified Stripe webhook events.
 * Called from routes/payments.js after signature verification.
 */
async function handleWebhookEvent(event) {
  switch (event.type) {
    // ── Subscription events ──────────────────────────────────
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const profile = await prisma.sellerProfile.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (!profile) break;

      const statusMap = {
        active: 'ACTIVE',
        past_due: 'PAST_DUE',
        canceled: 'CANCELLED',
        trialing: 'TRIALING',
      };

      await prisma.sellerProfile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: statusMap[sub.status] || 'CANCELLED',
          subscriptionEndsAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await prisma.sellerProfile.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { subscriptionStatus: 'CANCELLED' },
      });
      break;
    }

    // ── Payment events ───────────────────────────────────────
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (!orderId) break;

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'ACTIVE', stripePaymentIntentId: pi.id },
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (!orderId) break;

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
      break;
    }

    case 'invoice.payment_failed': {
      // Seller subscription payment failed
      const invoice = event.data.object;
      await prisma.sellerProfile.updateMany({
        where: { stripeCustomerId: invoice.customer },
        data: { subscriptionStatus: 'PAST_DUE' },
      });
      break;
    }

    default:
      console.log(`Unhandled webhook event: ${event.type}`);
  }
}

module.exports = {
  stripe,
  createSellerSubscription,
  cancelSellerSubscription,
  createOrderPaymentIntent,
  releaseEscrow,
  handleWebhookEvent,
};
