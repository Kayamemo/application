// ============================================================
// Role Guard Middleware
// Usage: router.post('/...', authenticate, requireRole('ADMIN'), handler)
// ============================================================

/**
 * Factory that returns middleware requiring the user to have one of
 * the specified roles. Must be used AFTER authenticate middleware.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  next();
};

/**
 * Shorthand guard — seller must have an ACTIVE subscription.
 * Used to gate service creation, order acceptance, etc.
 */
const requireActiveSubscription = (req, res, next) => {
  if (req.user?.role === 'ADMIN') return next(); // admins bypass subscription check
  // If Stripe not configured, bypass subscription requirement
  const stripeConfigured = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder');
  if (!stripeConfigured) return next();
  const profile = req.user?.sellerProfile;
  if (!profile || profile.subscriptionStatus !== 'ACTIVE') {
    return res.status(403).json({
      error: 'An active seller subscription is required.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }
  next();
};

module.exports = { requireRole, requireActiveSubscription };
