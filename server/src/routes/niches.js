// ============================================================
// Niche Routes — /api/niches
// Public: list niches. Admin: create / update / delete.
// Adding a new niche is a one-liner via POST (admin only).
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const prisma = new PrismaClient();

// ─── GET /api/niches — List all active niches ─────────────────
router.get('/', async (_req, res, next) => {
  try {
    const niches = await prisma.niche.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { services: { where: { isActive: true } } } },
      },
    });
    res.json(niches);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/niches/:slug ─────────────────────────────────────
router.get('/:slug', async (req, res, next) => {
  try {
    const niche = await prisma.niche.findUnique({
      where: { slug: req.params.slug },
      include: { _count: { select: { services: true } } },
    });
    if (!niche) return res.status(404).json({ error: 'Niche not found' });
    res.json(niche);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/niches — Admin: create niche ───────────────────
router.post('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, icon, description, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const niche = await prisma.niche.create({
      data: { name, slug, icon, description, sortOrder: sortOrder || 0 },
    });
    res.status(201).json(niche);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/niches/:id — Admin: update niche ─────────────
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, icon, description, sortOrder, isActive } = req.body;
    const niche = await prisma.niche.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name, slug: name.toLowerCase().replace(/\s+/g, '-') }),
        ...(icon !== undefined && { icon }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(niche);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/niches/:id — Admin: soft delete (deactivate) ─
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.niche.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Niche deactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
