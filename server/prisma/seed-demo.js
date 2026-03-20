// ============================================================
// Demo Data Seed — Run: node prisma/seed-demo.js
// Adds test sellers + services so you can explore the app
// Safe to run multiple times (uses upsert / skip-if-exists)
// ============================================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo1234!';

const SELLERS = [
  {
    email: 'marco.tutor@kaya.app',
    name: 'Marco Bianchi',
    bio: 'University mathematics professor with a passion for teaching. I make complex topics simple and fun.',
    location: 'Berlin, Germany',
    avatar: 'https://i.pravatar.cc/150?img=11',
    tagline: 'Math & Science made easy',
    skills: ['Mathematics', 'Physics', 'Statistics'],
    avgRating: 4.9,
    totalReviews: 34,
    services: [
      {
        niche: 'tutoring',
        title: 'Math & Physics Tutoring – All Levels',
        description: 'Struggling with math or physics? I have helped 100+ students improve their grades. From basic arithmetic to university-level calculus and quantum mechanics. Sessions are tailored to your learning style.',
        basePrice: 40,
        deliveryDays: 1,
        isRemote: true,
        tags: ['math', 'physics', 'tutoring', 'online', 'homework help'],
        images: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'],
        packages: [
          { name: 'Basic', description: '1-hour session', price: 40, deliveryDays: 1, revisions: 0, features: ['1 hour via video call', 'Homework help', 'Follow-up Q&A'] },
          { name: 'Standard', description: '3-session pack', price: 110, deliveryDays: 7, revisions: 0, isPopular: true, features: ['3 × 1-hour sessions', 'Custom exercises', 'Progress tracking', 'WhatsApp support'] },
          { name: 'Premium', description: '8-session monthly plan', price: 280, deliveryDays: 30, revisions: 0, features: ['8 × 1-hour sessions', 'Full curriculum plan', 'Practice tests', 'Priority booking', 'Parents report'] },
        ],
      },
      {
        niche: 'tutoring',
        title: 'Statistics & Data Analysis for Students',
        description: 'Excel in statistics for your university courses. I cover descriptive stats, probability, hypothesis testing, regression and SPSS/Excel analysis.',
        basePrice: 45,
        deliveryDays: 1,
        isRemote: true,
        tags: ['statistics', 'data', 'university', 'spss', 'excel'],
        images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600'],
        packages: [
          { name: 'Basic', description: 'Single topic session', price: 45, deliveryDays: 1, revisions: 0, features: ['1 hour', 'One topic deep-dive', 'Summary notes'] },
          { name: 'Standard', description: 'Full exam prep', price: 120, deliveryDays: 7, revisions: 1, isPopular: true, features: ['3 sessions', 'Past paper practice', 'Cheat sheet', 'Exam strategy'] },
        ],
      },
    ],
  },
  {
    email: 'sofia.clean@kaya.app',
    name: 'Sofia Meier',
    bio: 'Professional cleaner with 8 years experience. Eco-friendly products, reliable and thorough.',
    location: 'Munich, Germany',
    avatar: 'https://i.pravatar.cc/150?img=25',
    tagline: 'Your home, spotlessly clean',
    skills: ['Deep Cleaning', 'Move-out Cleaning', 'Office Cleaning'],
    avgRating: 4.7,
    totalReviews: 58,
    services: [
      {
        niche: 'cleaning',
        title: 'Professional Home Cleaning Service',
        description: 'I provide thorough, reliable home cleaning using eco-friendly products. Whether you need a regular clean or a deep clean before moving out, I will leave your home spotless. Fully insured.',
        basePrice: 60,
        deliveryDays: 1,
        isRemote: false,
        location: 'Munich, Germany',
        tags: ['cleaning', 'home', 'eco-friendly', 'deep clean', 'regular'],
        images: ['https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600'],
        packages: [
          { name: 'Basic', description: 'Standard clean (2h)', price: 60, deliveryDays: 1, revisions: 0, features: ['Kitchen & bathrooms', 'Vacuuming', 'Mopping', 'Dusting'] },
          { name: 'Standard', description: 'Deep clean (4h)', price: 110, deliveryDays: 1, revisions: 0, isPopular: true, features: ['Everything in Basic', 'Inside oven', 'Fridge clean', 'Window sills', 'Skirting boards'] },
          { name: 'Premium', description: 'Move-out clean', price: 180, deliveryDays: 1, revisions: 1, features: ['Full deep clean', 'Inside all cupboards', 'Limescale removal', 'Landlord-ready guarantee'] },
        ],
      },
      {
        niche: 'cleaning',
        title: 'Weekly & Bi-Weekly Cleaning Subscription',
        description: 'Keep your home consistently clean with a regular cleaning subscription. I will come on a fixed day each week or every two weeks. Bring my own eco supplies.',
        basePrice: 55,
        deliveryDays: 7,
        isRemote: false,
        location: 'Munich, Germany',
        tags: ['cleaning', 'weekly', 'regular', 'subscription', 'home'],
        images: ['https://images.unsplash.com/photo-1527515637462-cff94ead201b?w=600'],
        packages: [
          { name: 'Basic', description: 'Bi-weekly (2h each)', price: 55, deliveryDays: 14, revisions: 0, features: ['Every 2 weeks', '2 hours per visit', 'Main rooms + kitchen + bath'] },
          { name: 'Standard', description: 'Weekly (2.5h)', price: 95, deliveryDays: 7, revisions: 0, isPopular: true, features: ['Every week', '2.5 hours per visit', 'Full home', 'Laundry folding'] },
        ],
      },
    ],
  },
  {
    email: 'lucas.pets@kaya.app',
    name: 'Lucas Weber',
    bio: 'Animal lover and certified dog trainer. I treat every pet like my own. Available 7 days a week.',
    location: 'Hamburg, Germany',
    avatar: 'https://i.pravatar.cc/150?img=15',
    tagline: 'Professional care for your furry friends',
    skills: ['Dog Walking', 'Pet Sitting', 'Dog Training'],
    avgRating: 5.0,
    totalReviews: 21,
    services: [
      {
        niche: 'pet-care',
        title: 'Dog Walking – Daily Walks & Exercise',
        description: 'I will take your dog on a fun, safe, 45-minute walk every day. GPS-tracked walks with photo updates sent to you. Insured and first-aid certified. Your dog will come home happy and tired!',
        basePrice: 18,
        deliveryDays: 1,
        isRemote: false,
        location: 'Hamburg, Germany',
        tags: ['dog walking', 'pet care', 'dogs', 'daily walk', 'exercise'],
        images: ['https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600'],
        packages: [
          { name: 'Basic', description: 'Single walk (45 min)', price: 18, deliveryDays: 1, revisions: 0, features: ['45-minute walk', 'GPS tracking', 'Photo update', 'Poop bags included'] },
          { name: 'Standard', description: '5 walks / week', price: 80, deliveryDays: 7, revisions: 0, isPopular: true, features: ['5 × 45-min walks', 'Daily photo', 'Weekly report', 'Flexible schedule'] },
          { name: 'Premium', description: '10 walks + training', price: 150, deliveryDays: 14, revisions: 0, features: ['10 × 1-hour walks', 'Basic obedience training', 'Daily updates', 'Monthly progress report'] },
        ],
      },
      {
        niche: 'pet-care',
        title: 'Pet Sitting – Home Visits While You Travel',
        description: 'Going on holiday? I will visit your home to feed, play with and care for your pets. Cats, dogs, rabbits, birds — all welcome. Up to 3 visits per day, with photos every visit.',
        basePrice: 20,
        deliveryDays: 1,
        isRemote: false,
        location: 'Hamburg, Germany',
        tags: ['pet sitting', 'cat sitting', 'dog sitting', 'home visit', 'holiday'],
        images: ['https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600'],
        packages: [
          { name: 'Basic', description: '1 visit/day', price: 20, deliveryDays: 1, revisions: 0, features: ['1 × 30-min visit', 'Feeding & water', 'Litter/poop clean', 'Photo update'] },
          { name: 'Standard', description: '2 visits/day', price: 35, deliveryDays: 1, revisions: 0, isPopular: true, features: ['2 × 30-min visits', 'Feeding', 'Playtime', 'Full report'] },
        ],
      },
    ],
  },
  {
    email: 'anna.photo@kaya.app',
    name: 'Anna Schulz',
    bio: 'Freelance photographer specialising in portraits, events and product photography. 6 years experience.',
    location: 'Berlin, Germany',
    avatar: 'https://i.pravatar.cc/150?img=47',
    tagline: 'Capturing your best moments',
    skills: ['Portrait Photography', 'Event Photography', 'Product Photography'],
    avgRating: 4.8,
    totalReviews: 29,
    services: [
      {
        niche: 'photography',
        title: 'Portrait & Lifestyle Photography Session',
        description: 'Professional portrait session for individuals, couples or families. Indoor studio or outdoor location of your choice. You receive fully edited, high-resolution images within 5 days.',
        basePrice: 120,
        deliveryDays: 5,
        isRemote: false,
        location: 'Berlin, Germany',
        tags: ['portrait', 'photography', 'family', 'couples', 'lifestyle'],
        images: ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600'],
        packages: [
          { name: 'Basic', description: '1h shoot, 10 edited photos', price: 120, deliveryDays: 5, revisions: 1, features: ['1-hour session', '10 edited photos', 'Online gallery', '1 location'] },
          { name: 'Standard', description: '2h shoot, 25 edited photos', price: 220, deliveryDays: 5, revisions: 2, isPopular: true, features: ['2-hour session', '25 edited photos', 'Online gallery', '2 outfits', '1 location'] },
          { name: 'Premium', description: 'Half-day shoot, 50 photos', price: 380, deliveryDays: 7, revisions: 3, features: ['4-hour session', '50 edited photos', '2 locations', 'Multiple outfits', 'Printed album'] },
        ],
      },
      {
        niche: 'photography',
        title: 'Product Photography for Online Shops',
        description: 'Beautiful product photos that sell. White background, lifestyle shots, and detail close-ups. Perfect for Etsy, Amazon, your own website or social media. Fast turnaround.',
        basePrice: 80,
        deliveryDays: 3,
        isRemote: false,
        location: 'Berlin, Germany',
        tags: ['product photography', 'e-commerce', 'etsy', 'amazon', 'shop'],
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
        packages: [
          { name: 'Basic', description: '5 products, white bg', price: 80, deliveryDays: 3, revisions: 1, features: ['5 products', 'White background', '3 angles each', 'High resolution'] },
          { name: 'Standard', description: '10 products + lifestyle', price: 150, deliveryDays: 4, revisions: 2, isPopular: true, features: ['10 products', 'White + lifestyle shots', '5 angles each', 'Social media sizing'] },
        ],
      },
    ],
  },
  {
    email: 'tom.trainer@kaya.app',
    name: 'Tom Fischer',
    bio: 'Certified personal trainer and nutritionist. Helped 200+ clients reach their fitness goals. Online & in-person.',
    location: 'Frankfurt, Germany',
    avatar: 'https://i.pravatar.cc/150?img=8',
    tagline: 'Your fitness transformation starts here',
    skills: ['Weight Loss', 'Muscle Building', 'Nutrition Planning'],
    avgRating: 4.6,
    totalReviews: 47,
    services: [
      {
        niche: 'personal-training',
        title: 'Personal Training – In-Person or Online',
        description: 'Custom workout programs designed for your body type and goals. Whether you want to lose weight, build muscle or just stay active — I will create a plan that works and keep you accountable.',
        basePrice: 55,
        deliveryDays: 1,
        isRemote: true,
        location: 'Frankfurt, Germany',
        tags: ['personal training', 'fitness', 'workout', 'weight loss', 'muscle'],
        images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600'],
        packages: [
          { name: 'Basic', description: 'Single session (1h)', price: 55, deliveryDays: 1, revisions: 0, features: ['1-hour session', 'Online or in-person', 'Technique coaching', 'Session recap'] },
          { name: 'Standard', description: '8-session monthly pack', price: 380, deliveryDays: 30, revisions: 0, isPopular: true, features: ['8 × 1h sessions', 'Custom workout plan', 'Nutrition tips', 'Weekly check-in', 'WhatsApp support'] },
          { name: 'Premium', description: '12 sessions + full plan', price: 550, deliveryDays: 30, revisions: 0, features: ['12 × 1h sessions', 'Full fitness program', 'Meal plan', 'Body composition tracking', 'Priority booking'] },
        ],
      },
      {
        niche: 'personal-training',
        title: 'Custom Nutrition & Meal Plan',
        description: 'Eat right for your goals. I create fully personalised meal plans based on your dietary needs, food preferences and fitness targets. Includes macros, shopping lists and recipe ideas.',
        basePrice: 60,
        deliveryDays: 3,
        isRemote: true,
        tags: ['nutrition', 'meal plan', 'diet', 'macros', 'health'],
        images: ['https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600'],
        packages: [
          { name: 'Basic', description: '1-week meal plan', price: 60, deliveryDays: 3, revisions: 1, features: ['7-day meal plan', 'Macro breakdown', 'Shopping list', 'PDF delivery'] },
          { name: 'Standard', description: '4-week plan + coaching', price: 150, deliveryDays: 5, revisions: 2, isPopular: true, features: ['4-week plan', 'Weekly adjustments', 'Recipe book', 'WhatsApp Q&A'] },
        ],
      },
    ],
  },
  {
    email: 'hannah.cook@kaya.app',
    name: 'Hannah Müller',
    bio: 'Passionate home chef and cooking teacher. Specialising in healthy Mediterranean and German cuisine.',
    location: 'Cologne, Germany',
    avatar: 'https://i.pravatar.cc/150?img=44',
    tagline: 'Delicious food, made with love',
    skills: ['Meal Prep', 'Cooking Lessons', 'Catering'],
    avgRating: 4.9,
    totalReviews: 19,
    services: [
      {
        niche: 'cooking',
        title: 'Weekly Meal Prep – Healthy Home Cooking',
        description: 'I come to your home, cook a full week of healthy, delicious meals and portion them out in containers. You just heat and eat. Fully customised to your tastes and dietary needs.',
        basePrice: 90,
        deliveryDays: 1,
        isRemote: false,
        location: 'Cologne, Germany',
        tags: ['meal prep', 'cooking', 'healthy', 'home chef', 'weekly'],
        images: ['https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600'],
        packages: [
          { name: 'Basic', description: '5 meals for 1 person', price: 90, deliveryDays: 1, revisions: 0, features: ['5 portioned meals', 'Grocery shopping included', 'Nutritional info', 'Containers provided'] },
          { name: 'Standard', description: '10 meals for 1-2 people', price: 160, deliveryDays: 1, revisions: 1, isPopular: true, features: ['10 portioned meals', 'Grocery shopping', 'Custom menu', 'Dietary accommodations'] },
          { name: 'Premium', description: 'Full week for a family', price: 280, deliveryDays: 1, revisions: 1, features: ['21 meals', 'Family portions', 'Shopping included', 'Snacks & desserts', 'Recipe cards'] },
        ],
      },
      {
        niche: 'cooking',
        title: 'Private Cooking Lessons – Learn to Cook',
        description: 'Learn to cook delicious meals in the comfort of your own kitchen. I teach beginners and intermediate cooks. From knife skills to full dinner party menus. Fun, relaxed and practical.',
        basePrice: 70,
        deliveryDays: 1,
        isRemote: false,
        location: 'Cologne, Germany',
        tags: ['cooking lessons', 'learn to cook', 'private chef', 'kitchen', 'beginner'],
        images: ['https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=600'],
        packages: [
          { name: 'Basic', description: 'Single 2h lesson', price: 70, deliveryDays: 1, revisions: 0, features: ['2-hour lesson', 'You eat what we cook', 'Recipe card to keep', 'Technique focus'] },
          { name: 'Standard', description: '4-lesson course', price: 240, deliveryDays: 28, revisions: 0, isPopular: true, features: ['4 × 2h lessons', 'Full curriculum', 'Shopping lists', 'Private cookbook PDF'] },
        ],
      },
    ],
  },
  {
    email: 'max.repairs@kaya.app',
    name: 'Max Hoffmann',
    bio: 'Licensed handyman with 15 years experience. No job too small. Fast, reliable and fairly priced.',
    location: 'Stuttgart, Germany',
    avatar: 'https://i.pravatar.cc/150?img=3',
    tagline: 'Fix it right, fix it once',
    skills: ['Plumbing', 'Electrical', 'Furniture Assembly'],
    avgRating: 4.7,
    totalReviews: 83,
    services: [
      {
        niche: 'home-repairs',
        title: 'Handyman – General Home Repairs & Fixes',
        description: 'Need something fixed around the house? Leaking tap, broken door, hole in the wall, shelf installation — I can handle it all. Fully insured, fast response, fair prices.',
        basePrice: 50,
        deliveryDays: 2,
        isRemote: false,
        location: 'Stuttgart, Germany',
        tags: ['handyman', 'repairs', 'plumbing', 'electrical', 'furniture'],
        images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600'],
        packages: [
          { name: 'Basic', description: '1h small jobs', price: 50, deliveryDays: 2, revisions: 0, features: ['Up to 1 hour', '1–2 small tasks', 'Materials extra', 'Same-week availability'] },
          { name: 'Standard', description: 'Half-day (3h)', price: 130, deliveryDays: 2, revisions: 0, isPopular: true, features: ['Up to 3 hours', 'Multiple tasks', 'Materials advice', 'Flexible scheduling'] },
          { name: 'Premium', description: 'Full day', price: 220, deliveryDays: 3, revisions: 0, features: ['Full 8-hour day', 'Unlimited tasks', 'Priority scheduling', 'Follow-up check included'] },
        ],
      },
      {
        niche: 'home-repairs',
        title: 'IKEA & Flat-Pack Furniture Assembly',
        description: 'Hate assembling furniture? I assemble IKEA, Wayfair and all flat-pack furniture quickly and correctly. Available evenings and weekends. Bring my own tools.',
        basePrice: 40,
        deliveryDays: 1,
        isRemote: false,
        location: 'Stuttgart, Germany',
        tags: ['IKEA', 'furniture assembly', 'flat pack', 'wardrobe', 'shelves'],
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
        packages: [
          { name: 'Basic', description: '1 item assembly', price: 40, deliveryDays: 1, revisions: 0, features: ['1 furniture item', 'Tools provided', 'Waste disposal', 'Evenings/weekends ok'] },
          { name: 'Standard', description: '3 items', price: 100, deliveryDays: 1, revisions: 0, isPopular: true, features: ['Up to 3 items', 'Tools provided', 'Wall fixing if needed', 'Packaging disposal'] },
        ],
      },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding demo sellers and services...\n');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const sellerData of SELLERS) {
    // Upsert seller
    const existing = await prisma.user.findUnique({ where: { email: sellerData.email } });

    let seller;
    if (existing) {
      seller = existing;
      console.log(`ℹ️  Seller already exists: ${sellerData.name}`);
    } else {
      seller = await prisma.user.create({
        data: {
          name: sellerData.name,
          email: sellerData.email,
          password: hashedPassword,
          role: 'SELLER',
          bio: sellerData.bio,
          location: sellerData.location,
          avatar: sellerData.avatar,
          isVerified: true,
          sellerProfile: {
            create: {
              tagline: sellerData.tagline,
              subscriptionStatus: 'ACTIVE',
              avgRating: sellerData.avgRating,
              totalReviews: sellerData.totalReviews,
              totalOrders: sellerData.totalReviews + Math.floor(Math.random() * 10),
              skills: sellerData.skills,
              languages: ['English', 'German'],
              responseTime: 'Within 2 hours',
            },
          },
        },
      });
      console.log(`✅ Created seller: ${sellerData.name} (${sellerData.email})`);
    }

    // Create services (skip if seller already has services)
    const existingServices = await prisma.service.count({ where: { sellerId: seller.id } });
    if (existingServices > 0) {
      console.log(`   ↳ Services already exist, skipping\n`);
      continue;
    }

    for (const svc of sellerData.services) {
      const niche = await prisma.niche.findUnique({ where: { slug: svc.niche } });
      if (!niche) { console.log(`   ⚠️  Niche not found: ${svc.niche}`); continue; }

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
          isActive: true,
          packages: { create: svc.packages },
        },
      });
      console.log(`   ✅ Service: "${svc.title}"`);
    }
    console.log('');
  }

  console.log(`\n🎉 Demo seed complete!`);
  console.log(`\n📋 Test accounts (password: ${DEMO_PASSWORD}):`);
  SELLERS.forEach(s => console.log(`   ${s.email} — ${s.name}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
