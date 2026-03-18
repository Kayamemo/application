// ============================================================
// Socket.io Service
// Handles all real-time events: messages, typing, read receipts.
//
// Room naming convention:
//   user:{userId}            — private room for notifications
//   conversation:{id}        — shared room for chat participants
// ============================================================
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Initialize all Socket.io event handlers.
 * Called once from server/src/index.js.
 */
function initSocket(io) {
  // ── Auth middleware ─────────────────────────────────────────
  // Validate JWT before allowing the socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, avatar: true },
      });
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] ${socket.user.name} connected (${socket.id})`);

    // ── Join private notification room ──────────────────────
    socket.join(`user:${userId}`);

    // ── Join a conversation room ────────────────────────────
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        // Verify user is a participant
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { buyerId: true, sellerId: true },
        });
        if (!conv) return;
        if (conv.buyerId !== userId && conv.sellerId !== userId) return;

        socket.join(`conversation:${conversationId}`);
        socket.emit('joined_conversation', { conversationId });
      } catch (err) {
        console.error('[Socket] join_conversation error:', err);
      }
    });

    // ── Leave a conversation room ───────────────────────────
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Send a message ──────────────────────────────────────
    socket.on('send_message', async ({ conversationId, content, fileUrl, fileName, fileType }) => {
      try {
        if (!content && !fileUrl) return;

        // Verify participation
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { id: true, buyerId: true, sellerId: true },
        });
        if (!conv) return;
        if (conv.buyerId !== userId && conv.sellerId !== userId) return;

        // Persist message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            fileUrl,
            fileName,
            fileType,
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        // Update conversation's lastMessage
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessage: content || fileName || 'File attachment',
            lastMessageAt: new Date(),
          },
        });

        // Broadcast to all in the room (including sender)
        io.to(`conversation:${conversationId}`).emit('new_message', message);

        // Notify the other participant if they're not in the room
        const recipientId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
        io.to(`user:${recipientId}`).emit('notification', {
          type: 'NEW_MESSAGE',
          title: `New message from ${socket.user.name}`,
          body: content || 'Sent a file',
          link: `/messages/${conversationId}`,
        });
      } catch (err) {
        console.error('[Socket] send_message error:', err);
      }
    });

    // ── Typing indicator ────────────────────────────────────
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        name: socket.user.name,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', { userId });
    });

    // ── Mark messages as read ───────────────────────────────
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: userId },
            readAt: null,
          },
          data: { readAt: new Date() },
        });
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: userId,
        });
      } catch (err) {
        console.error('[Socket] mark_read error:', err);
      }
    });

    // ── Disconnect ──────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] ${socket.user.name} disconnected`);
    });
  });
}

module.exports = { initSocket };
