// ============================================================
// Auth Routes — /api/auth
// register, login, refresh token, logout, email verify,
// password reset, and "become a seller"
// ============================================================
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../services/email');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────

/** Generate a short-lived access token (15 min) */
const signAccess = (userId) =>
  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

/** Generate a long-lived refresh token (30 days) */
const signRefresh = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

/** Set refresh token as HttpOnly cookie */
const setRefreshCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    // 'none' required for cross-origin (Vercel frontend ↔ Railway backend)
    sameSite: isProd ? 'none' : 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// ─── POST /api/auth/register ─────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['BUYER', 'SELLER']).withMessage('Role must be BUYER or SELLER'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { name, email, password, role = 'BUYER', referralCode } = req.body;

      // Check if email already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const hashed = await bcrypt.hash(password, 12);
      const verifyToken = crypto.randomBytes(32).toString('hex');

      // Create user (and SellerProfile if role=SELLER)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          role,
          verifyToken,
          sellerProfile: role === 'SELLER' ? {
            create: {
              subscriptionStatus: 'TRIALING',
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
            },
          } : undefined,
        },
        select: { id: true, name: true, email: true, role: true },
      });

      // Handle referral code
      if (referralCode) {
        const referral = await prisma.referral.findUnique({ where: { code: referralCode } });
        if (referral && referral.referrerId !== user.id) {
          await prisma.referral.update({
            where: { code: referralCode },
            data: { referredId: user.id },
          });
        }
      }

      // Send verification email (fire and forget)
      const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
      sendEmail({
        to: email,
        subject: 'Verify your Kaya account',
        html: `<p>Hi ${name},</p><p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
      }).catch(console.error);

      const accessToken = signAccess(user.id);
      const refreshToken = signRefresh(user.id);
      setRefreshCookie(res, refreshToken);

      res.status(201).json({ user, accessToken });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { sellerProfile: { select: { subscriptionStatus: true } } },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const accessToken = signAccess(user.id);
      const refreshToken = signRefresh(user.id);
      setRefreshCookie(res, refreshToken);

      const { password: _, verifyToken: __, resetToken: ___, ...safeUser } = user;
      res.json({ user: safeUser, accessToken });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/refresh ───────────────────────────────────
// Uses the HttpOnly refresh token cookie to issue a new access token
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true,
                sellerProfile: { select: { subscriptionStatus: true } } },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = signAccess(user.id);
    const newRefresh = signRefresh(user.id);
    setRefreshCookie(res, newRefresh);

    res.json({ user, accessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// ─── GET /api/auth/verify-email ──────────────────────────────
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────
router.post('/forgot-password', body('email').isEmail(), async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond success to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Reset your Kaya password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });

    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────
router.post(
  '/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const user = await prisma.user.findFirst({
        where: { resetToken: token, resetExpires: { gt: new Date() } },
      });
      if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

      const hashed = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed, resetToken: null, resetExpires: null },
      });

      res.json({ message: 'Password reset successfully. Please log in.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
