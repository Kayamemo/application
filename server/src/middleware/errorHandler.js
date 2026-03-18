// ============================================================
// Global Error Handler Middleware
// Catches errors thrown or passed via next(err) from any route.
// ============================================================

const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ error: `${field} already in use` });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Stripe errors
  if (err.type?.startsWith('Stripe')) {
    return res.status(402).json({ error: err.message });
  }

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    return res.status(422).json({ errors: err.errors });
  }

  // Custom app errors with a status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Default 500
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};

/** Utility: create a custom error with a status code */
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = errorHandler;
module.exports.createError = createError;
