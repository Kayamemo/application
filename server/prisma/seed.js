// ============================================================
// Database Seed Script
// Run: node prisma/seed.js
// Seeds: niches, admin user, platform settings
// ============================================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Platform Settings ───────────────────────────────────
  await prisma.platformSetting.upsert({
    where: { key: 'platform_fee_pct' },
    create: { key: 'platform_fee_pct', value: '10' },
    update: {},
  });
  await prisma.platformSetting.upsert({
    where: { key: 'seller_subscription_price' },
    create: { key: 'seller_subscription_price', value: '7' },
    update: {},
  });
  await prisma.platformSetting.upsert({
    where: { key: 'referral_reward_amount' },
    create: { key: 'referral_reward_amount', value: '5' },
    update: {},
  });
  console.log('✅ Platform settings seeded');

  // ─── Niches ───────────────────────────────────────────────
  const niches = [
    { name: 'Gardening',         slug: 'gardening',         icon: '🌱', description: 'Lawn care, planting, landscaping', sortOrder: 1 },
    { name: 'Craftwork',         slug: 'craftwork',         icon: '🎨', description: 'Handmade crafts, art, DIY projects', sortOrder: 2 },
    { name: 'Tutoring',          slug: 'tutoring',          icon: '📚', description: 'Academic tutoring, language lessons', sortOrder: 3 },
    { name: 'Babysitting',       slug: 'babysitting',       icon: '👶', description: 'Childcare and babysitting services', sortOrder: 4 },
    { name: 'Cleaning',          slug: 'cleaning',          icon: '🧹', description: 'Home and office cleaning services', sortOrder: 5 },
    { name: 'Pet Care',          slug: 'pet-care',          icon: '🐾', description: 'Dog walking, pet sitting, grooming', sortOrder: 6 },
    { name: 'Photography',       slug: 'photography',       icon: '📷', description: 'Events, portraits, product photography', sortOrder: 7 },
    { name: 'Personal Training', slug: 'personal-training', icon: '💪', description: 'Fitness coaching and workout plans', sortOrder: 8 },
    { name: 'Home Repairs',      slug: 'home-repairs',      icon: '🔨', description: 'Plumbing, electrical, general repairs', sortOrder: 9 },
    { name: 'Cooking',           slug: 'cooking',           icon: '🍳', description: 'Meal prep, catering, cooking lessons', sortOrder: 10 },
  ];

  for (const niche of niches) {
    await prisma.niche.upsert({
      where: { slug: niche.slug },
      create: niche,
      update: {},
    });
  }
  console.log(`✅ ${niches.length} niches seeded`);

  // ─── Admin User ───────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kaya.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: 'Kaya Admin',
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        role: 'ADMIN',
        isVerified: true,
      },
    });
    console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // ─── Demo Seller (optional) ───────────────────────────────
  const demoEmail = 'demo-seller@kaya.app';
  const demoExisting = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demoExisting) {
    const demoSeller = await prisma.user.create({
      data: {
        name: 'Jane the Gardener',
        email: demoEmail,
        password: await bcrypt.hash('Demo1234!', 12),
        role: 'SELLER',
        bio: 'Professional gardener with 10 years of experience.',
        location: 'Austin, TX',
        isVerified: true,
        sellerProfile: {
          create: {
            tagline: 'Your garden, my passion',
            subscriptionStatus: 'ACTIVE',
            avgRating: 4.8,
            totalReviews: 12,
            totalOrders: 15,
            skills: ['Lawn Mowing', 'Planting', 'Landscaping'],
            languages: ['English', 'Spanish'],
            responseTime: 'Within 1 hour',
          },
        },
      },
    });

    // Add a demo service
    const gardeningNiche = await prisma.niche.findUnique({ where: { slug: 'gardening' } });
    if (gardeningNiche) {
      await prisma.service.create({
        data: {
          sellerId: demoSeller.id,
          nicheId: gardeningNiche.id,
          title: 'Professional Lawn Care & Garden Maintenance',
          description: 'I will take care of your lawn and garden professionally. Services include mowing, edging, weeding, planting, and seasonal cleanup. Over 10 years of experience with residential and commercial properties.',
          images: [],
          tags: ['lawn', 'garden', 'mowing', 'planting', 'landscaping'],
          basePrice: 75.00,
          deliveryDays: 1,
          location: 'Austin, TX',
          isRemote: false,
          packages: {
            create: [
              { name: 'Basic', description: 'Lawn mowing + edging', price: 50, deliveryDays: 1, revisions: 0, features: ['Lawn mowing', 'Edge trimming', 'Clipping cleanup'] },
              { name: 'Standard', description: 'Full lawn care', price: 90, deliveryDays: 1, revisions: 1, features: ['Lawn mowing', 'Edge trimming', 'Weeding', 'Leaf blowing'], isPopular: true },
              { name: 'Premium', description: 'Complete garden service', price: 150, deliveryDays: 2, revisions: 2, features: ['Full lawn care', 'Planting', 'Mulching', 'Fertilizing', 'Monthly schedule'] },
            ],
          },
        },
      });
    }
    console.log('✅ Demo seller + service created: demo-seller@kaya.app / Demo1234!');
  }

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
