// ============================================================
// Service (Gig) Routes — /api/services
// CRUD + search with filters: niche, price, rating, location, remote
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireRole, requireActiveSubscription } = require('../middleware/requireRole');

const prisma = new PrismaClient();

async function geocodeLocation(location) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Kaya-Marketplace/1.0' } }
    );
    const data = await res.json();
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ─── GET /api/services — Search & filter ─────────────────────
// Query params: niche, q, minPrice, maxPrice, minRating, location, remote,
//               lat, lng, radius (km), sort, page, limit
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      niche, q, minPrice, maxPrice, minRating,
      location, remote, lat, lng, radius,
      sort = 'createdAt', page = 1, limit = 12,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // When geo-radius filtering is requested, use raw SQL with Haversine formula
    if (lat && lng && radius) {
      const latF = parseFloat(lat);
      const lngF = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      // Build additional WHERE fragments for the raw query
      const extraClauses = [];
      const extraParams = [latF, lngF, radiusKm];

      if (niche) {
        extraClauses.push(`AND ni.slug = $${extraParams.length + 1}`);
        extraParams.push(niche);
      }
      if (q) {
        extraClauses.push(`AND (s.title ILIKE $${extraParams.length + 1} OR s.description ILIKE $${extraParams.length + 1})`);
        extraParams.push(`%${q}%`);
      }
      if (minPrice) {
        extraClauses.push(`AND s.base_price >= $${extraParams.length + 1}`);
        extraParams.push(parseFloat(minPrice));
      }
      if (maxPrice) {
        extraClauses.push(`AND s.base_price <= $${extraParams.length + 1}`);
        extraParams.push(parseFloat(maxPrice));
      }
      if (remote === 'true') {
        extraClauses.push(`AND s.is_remote = true`);
      }

      const baseWhere = `
        s.is_active = true
        AND (
          s.is_remote = true
          OR (
            s.lat IS NOT NULL AND s.lng IS NOT NULL
            AND (
              6371 * acos(
                LEAST(1.0, cos(radians($1)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians($2)) +
                sin(radians($1)) * sin(radians(s.lat)))
              )
            ) <= $3
          )
        )
        ${extraClauses.join('\n')}
      `;

      const sortClause = sort === 'price_asc'  ? 's.base_price ASC'
                       : sort === 'price_desc' ? 's.base_price DESC'
                       : sort === 'rating'     ? 'sp.avg_rating DESC NULLS LAST'
                       : 's.created_at DESC';

      const countParam = extraParams.map((_, i) => `$${i + 1}`);
      const [countResult, rows] = await Promise.all([
        prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as total
           FROM services s
           LEFT JOIN niches ni ON ni.id = s.niche_id
           LEFT JOIN users u ON u.id = s.seller_id
           LEFT JOIN seller_profiles sp ON sp.user_id = s.seller_id
           WHERE ${baseWhere}`,
          ...extraParams
        ),
        prisma.$queryRawUnsafe(
          `SELECT s.id, s.title, s.description, s.images, s.base_price, s.delivery_days,
                  s.location, s.lat, s.lng, s.is_remote, s.is_active, s.created_at,
                  u.id as seller_id, u.name as seller_name, u.avatar as seller_avatar,
                  sp.avg_rating, sp.total_reviews,
                  ni.name as niche_name, ni.slug as niche_slug, ni.icon as niche_icon,
                  CASE WHEN s.lat IS NOT NULL AND s.lng IS NOT NULL THEN
                    ROUND((6371 * acos(
                      LEAST(1.0, cos(radians($1)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians($2)) +
                      sin(radians($1)) * sin(radians(s.lat)))
                    ))::numeric, 1)
                  ELSE NULL END as distance_km
           FROM services s
           LEFT JOIN niches ni ON ni.id = s.niche_id
           LEFT JOIN users u ON u.id = s.seller_id
           LEFT JOIN seller_profiles sp ON sp.user_id = s.seller_id
           WHERE ${baseWhere}
           ORDER BY ${sortClause}
           LIMIT $${extraParams.length + 1} OFFSET $${extraParams.length + 2}`,
          ...extraParams, Number(limit), skip
        ),
      ]);

      const total = countResult[0]?.total || 0;
      // Reshape raw rows into the same shape as the Prisma query
      const services = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        images: r.images,
        basePrice: r.base_price,
        deliveryDays: r.delivery_days,
        location: r.location,
        lat: r.lat,
        lng: r.lng,
        isRemote: r.is_remote,
        distanceKm: r.distance_km,
        createdAt: r.created_at,
        niche: { name: r.niche_name, slug: r.niche_slug, icon: r.niche_icon },
        seller: {
          id: r.seller_id,
          name: r.seller_name,
          avatar: r.seller_avatar,
          sellerProfile: { avgRating: r.avg_rating, totalReviews: r.total_reviews },
        },
        packages: [],
      }));

      return res.json({
        services,
        pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
      });
    }

    // ── Standard (non-geo) query ──────────────────────────────
    const where = { isActive: true };

    if (niche) {
      where.niche = { slug: niche };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q.toLowerCase()] } },
      ];
    }

    if (minPrice || maxPrice) {
      where.basePrice = {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      };
    }

    if (minRating) {
      where.seller = {
        sellerProfile: { avgRating: { gte: parseFloat(minRating) } },
      };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (remote === 'true') {
      where.isRemote = true;
    }

    // Build sort order
    const orderBy = sort === 'price_asc'  ? { basePrice: 'asc' }
                  : sort === 'price_desc' ? { basePrice: 'desc' }
                  : sort === 'rating'     ? { seller: { sellerProfile: { avgRating: 'desc' } } }
                  : { createdAt: 'desc' };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          niche: { select: { name: true, slug: true, icon: true } },
          seller: {
            select: {
              id: true, name: true, avatar: true,
              sellerProfile: { select: { avgRating: true, totalReviews: true } },
            },
          },
          packages: { orderBy: { price: 'asc' }, take: 1 },
        },
      }),
      prisma.service.count({ where }),
    ]);

    res.json({
      services,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/services/seller/me — My services ────────────────
router.get('/seller/me', authenticate, requireRole('SELLER', 'ADMIN'), async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { sellerId: req.user.id },
      include: {
        niche: { select: { name: true, icon: true } },
        packages: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(services);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/services/:id — Single service ───────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        niche: true,
        seller: {
          select: {
            id: true, name: true, avatar: true, bio: true, location: true, createdAt: true,
            sellerProfile: {
              select: {
                tagline: true, skills: true, languages: true, responseTime: true,
                avgRating: true, totalReviews: true, totalOrders: true,
                completionRate: true, memberSince: true,
              },
            },
          },
        },
        packages: { orderBy: { price: 'asc' } },
        // Latest 10 reviews
        orders: {
          where: { review: { isNot: null } },
          take: 10,
          orderBy: { completedAt: 'desc' },
          include: {
            review: {
              include: { buyer: { select: { id: true, name: true, avatar: true } } },
            },
          },
        },
      },
    });

    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/services — Create service (sellers only) ───────
router.post(
  '/',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  requireActiveSubscription,
  async (req, res, next) => {
    try {
      const {
        nicheId, title, description, images, tags, basePrice,
        deliveryDays, location, lat, lng, isRemote, availability, packages,
      } = req.body;

      if (!nicheId || !title || !description || !basePrice) {
        return res.status(400).json({ error: 'nicheId, title, description, and basePrice are required' });
      }

      // Geocode if location provided but no coordinates
      let resolvedLat = lat ? parseFloat(lat) : null;
      let resolvedLng = lng ? parseFloat(lng) : null;
      if (location && !resolvedLat) {
        const geo = await geocodeLocation(location);
        if (geo) { resolvedLat = geo.lat; resolvedLng = geo.lng; }
      }

      const service = await prisma.service.create({
        data: {
          sellerId: req.user.id,
          nicheId,
          title,
          description,
          images: images || [],
          tags: tags || [],
          basePrice: parseFloat(basePrice),
          deliveryDays: deliveryDays || 3,
          location,
          lat: resolvedLat,
          lng: resolvedLng,
          isRemote: isRemote || false,
          availability,
          packages: packages?.length
            ? { create: packages.map((p) => ({
                name: p.name,
                description: p.description,
                price: parseFloat(p.price),
                deliveryDays: p.deliveryDays,
                revisions: p.revisions || 1,
                features: p.features || [],
                isPopular: p.isPopular || false,
              })) }
            : undefined,
        },
        include: { packages: true, niche: true },
      });

      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/services/:id — Update service ─────────────────
router.patch(
  '/:id',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  async (req, res, next) => {
    try {
      // Verify ownership
      const existing = await prisma.service.findUnique({
        where: { id: req.params.id },
        select: { sellerId: true },
      });
      if (!existing) return res.status(404).json({ error: 'Service not found' });
      if (existing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Not your service' });
      }

      const {
        title, description, images, tags, basePrice,
        deliveryDays, location, lat, lng, isRemote, availability, isActive,
      } = req.body;

      const service = await prisma.service.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(images && { images }),
          ...(tags && { tags }),
          ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
          ...(deliveryDays && { deliveryDays }),
          ...(location !== undefined && { location }),
          ...(lat !== undefined && { lat: lat ? parseFloat(lat) : null }),
          ...(lng !== undefined && { lng: lng ? parseFloat(lng) : null }),
          ...(isRemote !== undefined && { isRemote }),
          ...(availability !== undefined && { availability }),
          ...(isActive !== undefined && { isActive }),
        },
        include: { packages: true, niche: true },
      });

      res.json(service);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/services/:id — Deactivate service ────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      select: { sellerId: true },
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Service deactivated' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/services/seller/me — My services ────────────────
module.exports = router;
