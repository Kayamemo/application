// ============================================================
// JWT Authentication Middleware
// Verifies the Bearer token on protected routes and attaches
// the decoded user payload to req.user.
// ============================================================
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Protect a route — requires a valid JWT access token.
 * Token can be sent as:
 *   - Authorization: Bearer <token>
 *   - Cookie: accessToken=<token>
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Fall back to cookie
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch user to ensure they still exist and aren't banned
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        sellerProfile: {
          select: {
            subscriptionStatus: true,
            stripeSubscriptionId: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Optional auth — attaches req.user if token exists, but doesn't block.
 * Useful for public routes that show extra info for logged-in users.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, avatar: true },
      });
      if (user) req.user = user;
    }
  } catch (_err) {
    // Ignore token errors for optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuth };
