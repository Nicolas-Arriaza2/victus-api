const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.match.deleteMany();
  await prisma.swipeEvent.deleteMany();
  await prisma.activityEnrollment.deleteMany();
  await prisma.activitySession.deleteMany();
  await prisma.activityInterest.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create interests catalog
  const interests = await Promise.all([
    prisma.interest.create({ data: { name: 'Trekking', slug: 'trekking' } }),
    prisma.interest.create({ data: { name: 'Teatro', slug: 'teatro' } }),
    prisma.interest.create({ data: { name: 'Danza', slug: 'danza' } }),
    prisma.interest.create({ data: { name: 'Fitness', slug: 'fitness' } }),
    prisma.interest.create({ data: { name: 'Gastronomía', slug: 'gastronomia' } }),
    prisma.interest.create({ data: { name: 'Música', slug: 'musica' } }),
    prisma.interest.create({ data: { name: 'Arte', slug: 'arte' } }),
    prisma.interest.create({ data: { name: 'Deportes', slug: 'deportes' } }),
    prisma.interest.create({ data: { name: 'Bienestar', slug: 'bienestar' } }),
    prisma.interest.create({ data: { name: 'Aire libre', slug: 'aire-libre' } }),
  ]);

  const password = await argon2.hash('password123');

  // User A - Regular user
  const ana = await prisma.user.create({
    data: {
      email: 'ana@biktus.local',
      passwordHash: password,
      username: 'ana',
      role: 'USER',
      profile: {
        create: {
          firstName: 'Ana',
          lastName: 'Silva',
          bio: 'Amante del teatro y las actividades al aire libre',
          city: 'Santiago',
          latitude: -33.4489,
          longitude: -70.6693,
        },
      },
      interests: {
        create: [
          { interestId: interests[1].id }, // Teatro
          { interestId: interests[0].id }, // Trekking
          { interestId: interests[6].id }, // Arte
        ],
      },
    },
  });

  // User B - Regular user
  const bruno = await prisma.user.create({
    data: {
      email: 'bruno@biktus.local',
      passwordHash: password,
      username: 'bruno',
      role: 'USER',
      profile: {
        create: {
          firstName: 'Bruno',
          lastName: 'Pérez',
          bio: 'Deportista y amante del fitness',
          city: 'Santiago',
          latitude: -33.4372,
          longitude: -70.6506,
        },
      },
      interests: {
        create: [
          { interestId: interests[1].id }, // Teatro
          { interestId: interests[3].id }, // Fitness
          { interestId: interests[7].id }, // Deportes
        ],
      },
    },
  });

  // User C - Community Leader
  const carla = await prisma.user.create({
    data: {
      email: 'carla@biktus.local',
      passwordHash: password,
      username: 'carla_leader',
      role: 'COMMUNITY_LEADER',
      profile: {
        create: {
          firstName: 'Carla',
          lastName: 'Mendoza',
          bio: 'Organizadora de actividades culturales',
          city: 'Santiago',
          latitude: -33.4500,
          longitude: -70.6600,
        },
      },
    },
  });

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@biktus.local',
      passwordHash: password,
      username: 'admin',
      role: 'ADMIN',
      profile: { create: { firstName: 'Admin', lastName: 'Biktus' } },
    },
  });

  // Activity created by community leader
  const activity = await prisma.activity.create({
    data: {
      slug: 'teatro-impro-santiago',
      title: 'Teatro de Improvisación',
      type: 'theater',
      description: 'Curso intensivo de improvisación teatral para principiantes',
      createdById: carla.id,
      interests: {
        create: [
          { interestId: interests[1].id }, // Teatro
          { interestId: interests[6].id }, // Arte
        ],
      },
    },
  });

  const activity2 = await prisma.activity.create({
    data: {
      slug: 'trekking-cajon-del-maipo',
      title: 'Trekking Cajón del Maipo',
      type: 'trekking',
      description: 'Ruta de trekking por el Cajón del Maipo con guía',
      createdById: carla.id,
      interests: {
        create: [
          { interestId: interests[0].id }, // Trekking
          { interestId: interests[9].id }, // Aire libre
        ],
      },
    },
  });

  // Sessions
  const session1 = await prisma.activitySession.create({
    data: {
      activityId: activity.id,
      startsAt: new Date('2026-03-15T19:00:00Z'),
      endsAt: new Date('2026-03-15T21:00:00Z'),
      capacity: 20,
      priceCents: 15000,
      locationName: 'Centro Cultural GAM',
      latitude: -33.4400,
      longitude: -70.6545,
    },
  });

  const session2 = await prisma.activitySession.create({
    data: {
      activityId: activity2.id,
      startsAt: new Date('2026-03-22T09:00:00Z'),
      endsAt: new Date('2026-03-22T17:00:00Z'),
      capacity: 15,
      priceCents: 25000,
      locationName: 'Cajón del Maipo',
      latitude: -33.6000,
      longitude: -70.3800,
    },
  });

  // Enrollments
  await prisma.activityEnrollment.create({
    data: { sessionId: session1.id, userId: ana.id, status: 'confirmed' },
  });
  await prisma.activityEnrollment.create({
    data: { sessionId: session1.id, userId: bruno.id, status: 'confirmed' },
  });
  await prisma.activityEnrollment.create({
    data: { sessionId: session2.id, userId: ana.id, status: 'confirmed' },
  });

  // Swipe: Ana likes Bruno in session1
  await prisma.swipeEvent.create({
    data: {
      byUserId: ana.id,
      toUserId: bruno.id,
      sessionId: session1.id,
      action: 'LIKE',
    },
  });

  // Swipe: Bruno likes Ana in session1 -> creates a match
  await prisma.swipeEvent.create({
    data: {
      byUserId: bruno.id,
      toUserId: ana.id,
      sessionId: session1.id,
      action: 'LIKE',
    },
  });

  // Create match (mutual like)
  const [userAId, userBId] = ana.id < bruno.id ? [ana.id, bruno.id] : [bruno.id, ana.id];
  await prisma.match.create({
    data: { userAId, userBId, sessionId: session1.id },
  });

  console.log('Seed completed successfully!');
  console.log('---');
  console.log('Users (password: password123):');
  console.log(`  Ana (USER):            ${ana.email}`);
  console.log(`  Bruno (USER):          ${bruno.email}`);
  console.log(`  Carla (LEADER):        ${carla.email}`);
  console.log(`  Admin:                 ${admin.email}`);
  console.log('---');
  console.log('Activities:', activity.title, '|', activity2.title);
  console.log('Sessions:', session1.id, '|', session2.id);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
