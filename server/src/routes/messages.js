// ============================================================
// Message Routes — /api/messages
// REST endpoints for loading conversation history and list.
// Real-time sending is handled by Socket.io (services/socket.js).
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// ─── GET /api/messages/conversations — List all conversations ─
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        service: { select: { id: true, title: true, images: true } },
        // Count unread messages
        messages: {
          where: { senderId: { not: userId }, readAt: null },
          select: { id: true },
        },
      },
    });

    // Shape the response to include unreadCount and the "other" user
    const result = conversations.map((c) => ({
      id: c.id,
      other: c.buyerId === userId ? c.seller : c.buyer,
      service: c.service,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c.messages.length,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/messages/conversations/:id — Message history ───
router.get('/conversations/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify participant
    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        service: { select: { id: true, title: true, images: true } },
        order: { select: { id: true, status: true, amount: true } },
      },
    });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: req.params.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.message.count({ where: { conversationId: req.params.id } }),
    ]);

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: req.params.id,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({
      conversation: conv,
      messages: messages.reverse(), // Chronological order
      total,
      page: Number(page),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/messages/conversations — Start a conversation ─
router.post('/conversations', authenticate, async (req, res, next) => {
  try {
    const { sellerId, serviceId } = req.body;
    if (!sellerId) return res.status(400).json({ error: 'sellerId required' });

    const userId = req.user.id;
    if (userId === sellerId) return res.status(400).json({ error: 'Cannot message yourself' });

    const conversation = await prisma.conversation.upsert({
      where: {
        buyerId_sellerId_serviceId: {
          buyerId: userId,
          sellerId,
          serviceId: serviceId || null,
        },
      },
      create: {
        buyerId: userId,
        sellerId,
        serviceId: serviceId || null,
      },
      update: {},
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        service: { select: { id: true, title: true, images: true } },
      },
    });

    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
