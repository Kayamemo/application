// ============================================================
// Database Seed Script
// Run: node prisma/seed.js  (also runs automatically on deploy)
// ============================================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSellerWithServices(sellerData, password) {
  try {
  const existing = await prisma.user.findUnique({ where: { email: sellerData.email } });
  if (existing) {
    console.log(`ℹ️  Already exists: ${sellerData.name}`);
    return;
  }

  const seller = await prisma.user.create({
    data: {
      name: sellerData.name,
      email: sellerData.email,
      password: password,
      role: 'SELLER',
      bio: sellerData.bio,
      location: sellerData.location,
      isVerified: true,
      sellerProfile: {
        create: {
          tagline: sellerData.tagline,
          subscriptionStatus: 'ACTIVE',
          avgRating: sellerData.avgRating,
          totalReviews: sellerData.totalReviews,
          totalOrders: sellerData.totalOrders,
          skills: sellerData.skills,
          languages: ['English', 'German'],
          responseTime: 'Within 2 hours',
        },
      },
    },
  });

  for (const svc of sellerData.services) {
    const niche = await prisma.niche.findUnique({ where: { slug: svc.niche } });
    if (!niche) continue;
    await prisma.service.create({
      data: {
        sellerId: seller.id,
        nicheId: niche.id,
        title: svc.title,
        description: svc.description,
        images: svc.images || [],
        tags: svc.tags,
        basePrice: svc.basePrice,
        deliveryDays: svc.deliveryDays,
        isRemote: svc.isRemote ?? false,
        location: svc.location || sellerData.location,
        lat: svc.lat ?? sellerData.lat ?? null,
        lng: svc.lng ?? sellerData.lng ?? null,
        isActive: true,
        packages: { create: svc.packages },
      },
    });
  }
  console.log(`✅ Created: ${sellerData.name}`);
  } catch (e) {
    console.error(`❌ Failed to create ${sellerData.name}:`, e.message);
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Platform Settings ────────────────────────────────────
  await prisma.platformSetting.upsert({ where: { key: 'platform_fee_pct' },        create: { key: 'platform_fee_pct', value: '10' },        update: {} });
  await prisma.platformSetting.upsert({ where: { key: 'seller_subscription_price' }, create: { key: 'seller_subscription_price', value: '7' }, update: {} });
  await prisma.platformSetting.upsert({ where: { key: 'referral_reward_amount' },    create: { key: 'referral_reward_amount', value: '5' },    update: {} });
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
    await prisma.niche.upsert({ where: { slug: niche.slug }, create: niche, update: {} });
  }
  console.log(`✅ ${niches.length} niches seeded`);

  // ─── Admin User ───────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kaya.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.user.create({
      data: { name: 'Kaya Admin', email: adminEmail, password: await bcrypt.hash(adminPassword, 12), role: 'ADMIN', isVerified: true },
    });
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️  Admin already exists`);
  }

  // ─── Demo Password ────────────────────────────────────────
  const demoPassword = await bcrypt.hash('Demo1234!', 12);

  // ─── Demo Sellers & Services ──────────────────────────────
  await createSellerWithServices({
    email: 'demo-seller@kaya.app',
    name: 'Jane the Gardener',
    bio: 'Professional gardener with 10 years of experience. Residential and commercial.',
    location: 'Berlin, Germany',
    lat: 52.5200, lng: 13.4050,
    tagline: 'Your garden, my passion',
    avgRating: 4.8, totalReviews: 12, totalOrders: 15,
    skills: ['Lawn Mowing', 'Planting', 'Landscaping'],
    services: [
      {
        niche: 'gardening',
        title: 'Professional Lawn Care & Garden Maintenance',
        description: 'I will take care of your lawn and garden professionally. Mowing, edging, weeding, planting and seasonal cleanup. Over 10 years of experience.',
        basePrice: 75, deliveryDays: 1, isRemote: false,
        tags: ['lawn', 'garden', 'mowing', 'planting', 'landscaping'],
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600'],
        packages: [
          { name: 'Basic',    description: 'Lawn mowing + edging',      price: 50,  deliveryDays: 1, revisions: 0, features: ['Lawn mowing', 'Edge trimming', 'Clipping cleanup'] },
          { name: 'Standard', description: 'Full lawn care',             price: 90,  deliveryDays: 1, revisions: 1, features: ['Lawn mowing', 'Edge trimming', 'Weeding', 'Leaf blowing'], isPopular: true },
          { name: 'Premium',  description: 'Complete garden service',    price: 150, deliveryDays: 2, revisions: 2, features: ['Full lawn care', 'Planting', 'Mulching', 'Fertilizing'] },
        ],
      },
    ],
  }, demoPassword);

  await createSellerWithServices({
    email: 'marco.tutor@kaya.app',
    name: 'Marco Bianchi',
    bio: 'University mathematics professor. I make complex topics simple and fun for all ages.',
    location: 'Berlin, Germany',
    lat: 52.5200, lng: 13.4050,
    tagline: 'Math & Science made easy',
    avgRating: 4.9, totalReviews: 34, totalOrders: 40,
    skills: ['Mathematics', 'Physics', 'Statistics'],
    services: [
      {
        niche: 'tutoring',
        title: 'Math & Physics Tutoring – All Levels',
        description: 'Struggling with math or physics? I have helped 100+ students improve their grades. Sessions are tailored to your level, from school basics to university calculus.',
        basePrice: 40, deliveryDays: 1, isRemote: true,
        tags: ['math', 'physics', 'tutoring', 'online', 'homework help'],
        images: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'],
        packages: [
          { name: 'Basic',    description: '1-hour session',          price: 40,  deliveryDays: 1,  revisions: 0, features: ['1 hour via video call', 'Homework help', 'Follow-up Q&A'] },
          { name: 'Standard', description: '3-session pack',          price: 110, deliveryDays: 7,  revisions: 0, features: ['3 × 1-hour sessions', 'Custom exercises', 'Progress tracking'], isPopular: true },
          { name: 'Premium',  description: '8-session monthly plan',  price: 280, deliveryDays: 30, revisions: 0, features: ['8 × 1-hour sessions', 'Full curriculum plan', 'Practice tests', 'Priority booking'] },
        ],
      },
    ],
  }, demoPassword);

  await createSellerWithServices({
    email: 'sofia.clean@kaya.app',
    name: 'Sofia Meier',
    bio: 'Professional cleaner with 8 years experience. Eco-friendly products, reliable and thorough.',
    location: 'Munich, Germany',
    lat: 48.1351, lng: 11.5820,
    tagline: 'Your home, spotlessly clean',
    avgRating: 4.7, totalReviews: 58, totalOrders: 65,
    skills: ['Deep Cleaning', 'Move-out Cleaning', 'Office Cleaning'],
    services: [
      {
        niche: 'cleaning',
        title: 'Professional Home Cleaning Service',
        description: 'Thorough, reliable home cleaning using eco-friendly products. Regular clean or deep clean before moving out — I will leave your home spotless. Fully insured.',
        basePrice: 60, deliveryDays: 1, isRemote: false,
        location: 'Munich, Germany',
        tags: ['cleaning', 'home', 'eco-friendly', 'deep clean'],
        images: ['https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600'],
        packages: [
          { name: 'Basic',    description: 'Standard clean (2h)', price: 60,  deliveryDays: 1, revisions: 0, features: ['Kitchen & bathrooms', 'Vacuuming', 'Mopping', 'Dusting'] },
          { name: 'Standard', description: 'Deep clean (4h)',      price: 110, deliveryDays: 1, revisions: 0, features: ['Everything in Basic', 'Inside oven', 'Fridge clean', 'Window sills'], isPopular: true },
          { name: 'Premium',  description: 'Move-out clean',       price: 180, deliveryDays: 1, revisions: 1, features: ['Full deep clean', 'Inside all cupboards', 'Limescale removal', 'Landlord-ready guarantee'] },
        ],
      },
    ],
  }, demoPassword);

  await createSellerWithServices({
    email: 'lucas.pets@kaya.app',
    name: 'Lucas Weber',
    bio: 'Animal lover and certified dog trainer. I treat every pet like my own. 7 days a week.',
    location: 'Hamburg, Germany',
    lat: 53.5511, lng: 9.9937,
    tagline: 'Professional care for your furry friends',
    avgRating: 5.0, totalReviews: 21, totalOrders: 25,
    skills: ['Dog Walking', 'Pet Sitting', 'Dog Training'],
    services: [
      {
        niche: 'pet-care',
        title: 'Dog Walking – Daily Walks & Exercise',
        description: 'Fun, safe 45-minute walks with GPS tracking and photo updates. Insured and first-aid certified. Your dog will come home happy and tired!',
        basePrice: 18, deliveryDays: 1, isRemote: false,
        location: 'Hamburg, Germany',
        tags: ['dog walking', 'pet care', 'dogs', 'daily walk'],
        images: ['https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600'],
        packages: [
          { name: 'Basic',    description: 'Single walk (45 min)',  price: 18,  deliveryDays: 1, revisions: 0, features: ['45-minute walk', 'GPS tracking', 'Photo update', 'Poop bags included'] },
          { name: 'Standard', description: '5 walks / week',        price: 80,  deliveryDays: 7, revisions: 0, features: ['5 × 45-min walks', 'Daily photo', 'Weekly report', 'Flexible schedule'], isPopular: true },
          { name: 'Premium',  description: '10 walks + training',   price: 150, deliveryDays: 14, revisions: 0, features: ['10 × 1-hour walks', 'Basic obedience training', 'Daily updates'] },
        ],
      },
    ],
  }, demoPassword);

  await createSellerWithServices({
    email: 'anna.photo@kaya.app',
    name: 'Anna Schulz',
    bio: 'Freelance photographer specialising in portraits, events and product photography. 6 years experience.',
    location: 'Berlin, Germany',
    lat: 52.5200, lng: 13.4050,
    tagline: 'Capturing your best moments',
    avgRating: 4.8, totalReviews: 29, totalOrders: 33,
    skills: ['Portrait Photography', 'Event Photography', 'Product Photography'],
    services: [
      {
        niche: 'photography',
        title: 'Portrait & Lifestyle Photography Session',
        description: 'Professional portrait session for individuals, couples or families. Indoor or outdoor. Fully edited high-resolution images delivered within 5 days.',
        basePrice: 120, deliveryDays: 5, isRemote: false,
        location: 'Berlin, Germany',
        tags: ['portrait', 'photography', 'family', 'couples', 'lifestyle'],
        images: ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600'],
        packages: [
          { name: 'Basic',    description: '1h shoot, 10 edited photos',    price: 120, deliveryDays: 5, revisions: 1, features: ['1-hour session', '10 edited photos', 'Online gallery'] },
          { name: 'Standard', description: '2h shoot, 25 edited photos',    price: 220, deliveryDays: 5, revisions: 2, features: ['2-hour session', '25 edited photos', '2 outfits'], isPopular: true },
          { name: 'Premium',  description: 'Half-day shoot, 50 photos',     price: 380, deliveryDays: 7, revisions: 3, features: ['4-hour session', '50 edited photos', '2 locations', 'Printed album'] },
        ],
      },
    ],
  }, demoPassword);

  await createSellerWithServices({
    email: 'tom.trainer@kaya.app',
    name: 'Tom Fischer',
    bio: 'Certified personal trainer and nutritionist. Helped 200+ clients reach their fitness goals.',
    location: 'Frankfurt, Germany',
    lat: 50.1109, lng: 8.6821,
    tagline: 'Your fitness transformation starts here',
    avgRating: 4.6, totalReviews: 47, totalOrders: 55,
    skills: ['Weight Loss', 'Muscle Building', 'Nutrition Planning'],
    services: [
      {
        niche: 'personal-training',
        title: 'Personal Training – Online or In-Person',
        description: 'Custom workout programs designed for your body and goals. Weight loss, muscle building or staying active — I create a plan that works and keep you accountable.',
        basePrice: 55, deliveryDays: 1, isRemote: true,
        location: 'Frankfurt, Germany',
        tags: ['personal training', 'fitness', 'workout', 'weight loss', 'muscle'],
        images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600'],
        packages: [
          { name: 'Basic',    description: 'Single session (1h)',          price: 55,  deliveryDays: 1,  revisions: 0, features: ['1-hour session', 'Online or in-person', 'Session recap'] },
          { name: 'Standard', description: '8-session monthly pack',       price: 380, deliveryDays: 30, revisions: 0, features: ['8 × 1h sessions', 'Custom workout plan', 'Nutrition tips', 'WhatsApp support'], isPopular: true },
          { name: 'Premium',  description: '12 sessions + full plan',      price: 550, deliveryDays: 30, revisions: 0, features: ['12 × 1h sessions', 'Full fitness program', 'Meal plan', 'Body tracking'] },
        ],
      },
    ],
  }, demoPassword);

  await createSellerWithServices({
    email: 'hannah.cook@kaya.app',
    name: 'Hannah Müller',
    bio: 'Passionate home chef and cooking teacher. Specialising in healthy Mediterranean and German cuisine.',
    location: 'Cologne, Germany',
    lat: 50.9333, lng: 6.9500,
    tagline: 'Delicious food, made with love',
    avgRating: 4.9, totalReviews: 19, totalOrders: 22,
    skills: ['Meal Prep', 'Cooking Lessons', 'Catering'],
    services: [
      {
        niche: 'cooking',
        title: 'Weekly Meal Prep – Healthy Home Cooking',
        description: 'I come to your home, cook a full week of healthy meals and portion them in containers. You just heat and eat. Fully customised to your tastes and dietary needs.',
        basePrice: 90, deliveryDays: 1, isRemote: false,
        location: 'Cologne, Germany',
        tags: ['meal prep', 'cooking', 'healthy', 'home chef', 'weekly'],
        images: ['https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600'],
        packages: [
          { name: 'Basic',    description: '5 meals for 1 person',        price: 90,  deliveryDays: 1, revisions: 0, features: ['5 portioned meals', 'Grocery shopping included', 'Containers provided'] },
          { name: 'Standard', description: '10 meals for 1–2 people',     price: 160, deliveryDays: 1, revisions: 1, features: ['10 portioned meals', 'Custom menu', 'Dietary accommodations'], isPopular: true },
          { name: 'Premium',  description: 'Full week for a family',      price: 280, deliveryDays: 1, revisions: 1, features: ['21 meals', 'Family portions', 'Snacks & desserts', 'Recipe cards'] },
        ],
      },
    ],
  }, demoPassword);

  await createSellerWithServices({
    email: 'max.repairs@kaya.app',
    name: 'Max Hoffmann',
    bio: 'Licensed handyman with 15 years experience. No job too small. Fast, reliable, fairly priced.',
    location: 'Stuttgart, Germany',
    lat: 48.7758, lng: 9.1829,
    tagline: 'Fix it right, fix it once',
    avgRating: 4.7, totalReviews: 83, totalOrders: 90,
    skills: ['Plumbing', 'Electrical', 'Furniture Assembly'],
    services: [
      {
        niche: 'home-repairs',
        title: 'Handyman – General Home Repairs & Fixes',
        description: 'Leaking tap, broken door, shelf installation — I handle it all. Fully insured, fast response, fair prices.',
        basePrice: 50, deliveryDays: 2, isRemote: false,
        location: 'Stuttgart, Germany',
        tags: ['handyman', 'repairs', 'plumbing', 'furniture', 'home'],
        images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600'],
        packages: [
          { name: 'Basic',    description: '1h small jobs',   price: 50,  deliveryDays: 2, revisions: 0, features: ['Up to 1 hour', '1–2 small tasks', 'Materials extra'] },
          { name: 'Standard', description: 'Half-day (3h)',   price: 130, deliveryDays: 2, revisions: 0, features: ['Up to 3 hours', 'Multiple tasks', 'Flexible scheduling'], isPopular: true },
          { name: 'Premium',  description: 'Full day',        price: 220, deliveryDays: 3, revisions: 0, features: ['Full 8-hour day', 'Unlimited tasks', 'Priority scheduling'] },
        ],
      },
    ],
  }, demoPassword);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
