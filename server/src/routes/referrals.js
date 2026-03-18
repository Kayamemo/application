// ============================================================
// Referral Routes — /api/referrals
// Each seller gets a referral code. When a new user signs up
// with it, the referrer earns a credit ($5 default).
// ============================================================
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

// ─── GET /api/referrals/my-code — Get or create my referral code ─
router.get('/my-code', authenticate, async (req, res, next) => {
  try {
    let referral = await prisma.referral.findFirst({
      where: { referrerId: req.user.id },
      select: { code: true, rewardAmount: true },
    });

    if (!referral) {
      const code = nanoid(8).toUpperCase();
      referral = await prisma.referral.create({
        data: {
          referrerId: req.user.id,
          referredId: req.user.id, // self-placeholder until someone uses it
          code,
        },
        select: { code: true, rewardAmount: true },
      });
    }

    const shareUrl = `${process.env.CLIENT_URL}/register?ref=${referral.code}`;
    res.json({ code: referral.code, shareUrl, rewardAmount: referral.rewardAmount });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/referrals/stats — My referral stats ─────────────
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.user.id, referredId: { not: req.user.id } },
      include: {
        referred: { select: { name: true, createdAt: true } },
      },
    });

    const totalEarned = referrals
      .filter((r) => r.rewardPaid)
      .reduce((sum, r) => sum + parseFloat(r.rewardAmount), 0);

    const pendingRewards = referrals
      .filter((r) => !r.rewardPaid)
      .reduce((sum, r) => sum + parseFloat(r.rewardAmount), 0);

    res.json({
      totalReferrals: referrals.length,
      totalEarned,
      pendingRewards,
      referrals,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/referrals/validate/:code — Check if code is valid ─
router.get('/validate/:code', async (req, res, next) => {
  try {
    const referral = await prisma.referral.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: { referrer: { select: { name: true, avatar: true } } },
    });

    if (!referral) return res.status(404).json({ valid: false });

    res.json({
      valid: true,
      referrerName: referral.referrer.name,
      rewardAmount: referral.rewardAmount,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
