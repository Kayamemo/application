// ============================================================
// Kaya Marketplace — Express + Socket.io Entry Point
// ============================================================
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const { initSocket } = require('./services/socket');

// ─── Route imports ────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const nicheRoutes = require('./routes/niches');
const serviceRoutes = require('./routes/services');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/uploads');
const referralRoutes = require('./routes/referrals');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('trust proxy', 1); // Required for Render/Railway reverse proxy
const server = http.createServer(app);

// ─── Socket.io setup ─────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
initSocket(io); // Wire up all socket event handlers

// Make io accessible in routes via req.io
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── Core middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(cookieParser());

// Stripe webhooks require raw body — register BEFORE json middleware
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter for auth endpoints
  message: { error: 'Too many auth attempts, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/niches', nicheRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Global error handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Kaya API running on http://localhost:${PORT}`);
});

module.exports = { app, server };
