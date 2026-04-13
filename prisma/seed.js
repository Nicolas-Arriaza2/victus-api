const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function main() {
  // ── Clean ──────────────────────────────────────────────────────────────────
  await prisma.subscriptionBilling.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.leaderBankInfo.deleteMany();
  await prisma.userPhoto.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
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

  // ── Interests catalog (25 etiquetas en 5 categorías) ──────────────────────
  const interestData = [
    // Baile & Música
    { name: 'Salsa',          slug: 'salsa'          },
    { name: 'Bachata',        slug: 'bachata'        },
    { name: 'Tango',          slug: 'tango'          },
    { name: 'Reggaetón',      slug: 'reggaeton'      },
    { name: 'Folclore',       slug: 'folclore'       },
    { name: 'Música',         slug: 'musica'         },
    // Deporte & Naturaleza
    { name: 'Trekking',       slug: 'trekking'       },
    { name: 'Senderismo',     slug: 'senderismo'     },
    { name: 'Escalada',       slug: 'escalada'       },
    { name: 'Ciclismo',       slug: 'ciclismo'       },
    { name: 'Running',        slug: 'running'        },
    { name: 'Surf',           slug: 'surf'           },
    // Artes & Escena
    { name: 'Teatro',         slug: 'teatro'         },
    { name: 'Comedia',        slug: 'comedia'        },
    { name: 'Fotografía',     slug: 'fotografia'     },
    { name: 'Arte',           slug: 'arte'           },
    { name: 'Cine',           slug: 'cine'           },
    // Social & Grupal
    { name: 'Juegos de mesa', slug: 'juegos-de-mesa' },
    { name: 'Asados',         slug: 'asados'         },
    { name: 'Voluntariado',   slug: 'voluntariado'   },
    { name: 'Viajes grupales',slug: 'viajes-grupales'},
    // Bienestar
    { name: 'Yoga',           slug: 'yoga'           },
    { name: 'Fitness',        slug: 'fitness'        },
    { name: 'Meditación',     slug: 'meditacion'     },
    { name: 'Gastronomía',    slug: 'gastronomia'    },
  ];

  const allInterests = await Promise.all(
    interestData.map((d) => prisma.interest.create({ data: d })),
  );

  const bySlug = Object.fromEntries(allInterests.map((i) => [i.slug, i]));

  // Aliases for easy reference
  const { salsa, bachata, tango, musica, trekking, senderismo, escalada, ciclismo,
    running, surf, teatro, comedia, fotografia, arte, cine,
    'juegos-de-mesa': juegosMesa, asados, voluntariado, 'viajes-grupales': viajesGrupales,
    yoga, fitness, meditacion, gastronomia } = bySlug;

  const password = await argon2.hash('password123');

  // ── Users ──────────────────────────────────────────────────────────────────

  // MAIN LEADER — Valentina Reyes (lider@biktus.local)
  const valentina = await prisma.user.create({
    data: {
      email: 'lider@biktus.local',
      passwordHash: password,
      username: 'valentina',
      roles: ['USER', 'COMMUNITY_LEADER'],
      profile: {
        create: {
          firstName: 'Valentina',
          lastName: 'Reyes',
          bio: 'Instructora de yoga y meditación. Me encanta conectar personas con el bienestar.',
          city: 'Santiago',
          gender: 'female',
          birthdate: new Date('1990-03-15'),
          latitude: -33.4489,
          longitude: -70.6693,
        },
      },
      interests: {
        create: [
          { interestId: yoga.id },
          { interestId: meditacion.id },
          { interestId: salsa.id },
          { interestId: musica.id },
        ],
      },
    },
  });

  // User: Ana Silva
  const ana = await prisma.user.create({
    data: {
      email: 'ana@biktus.local',
      passwordHash: password,
      username: 'ana',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Ana',
          lastName: 'Silva',
          bio: 'Amante del teatro y las actividades al aire libre',
          city: 'Santiago',
          gender: 'female',
          birthdate: new Date('1995-07-22'),
          latitude: -33.4420,
          longitude: -70.6580,
        },
      },
      interests: {
        create: [
          { interestId: teatro.id },
          { interestId: trekking.id },
          { interestId: arte.id },
          { interestId: yoga.id },
          { interestId: fotografia.id },
        ],
      },
    },
  });

  // User: Bruno Pérez
  const bruno = await prisma.user.create({
    data: {
      email: 'bruno@biktus.local',
      passwordHash: password,
      username: 'bruno',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Bruno',
          lastName: 'Pérez',
          bio: 'Deportista y amante del fitness y la buena cocina',
          city: 'Santiago',
          gender: 'male',
          birthdate: new Date('1992-11-08'),
          latitude: -33.4372,
          longitude: -70.6506,
        },
      },
      interests: {
        create: [
          { interestId: fitness.id },
          { interestId: running.id },
          { interestId: gastronomia.id },
          { interestId: asados.id },
        ],
      },
    },
  });

  // User: Diego Morales
  const diego = await prisma.user.create({
    data: {
      email: 'diego@biktus.local',
      passwordHash: password,
      username: 'diego',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Diego',
          lastName: 'Morales',
          bio: 'Músico y trekker de fin de semana',
          city: 'Santiago',
          gender: 'male',
          birthdate: new Date('1988-04-14'),
          latitude: -33.4550,
          longitude: -70.6750,
        },
      },
      interests: {
        create: [
          { interestId: musica.id },
          { interestId: trekking.id },
          { interestId: senderismo.id },
          { interestId: escalada.id },
        ],
      },
    },
  });

  // User: Fernanda Castro
  const fernanda = await prisma.user.create({
    data: {
      email: 'fernanda@biktus.local',
      passwordHash: password,
      username: 'fernanda',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Fernanda',
          lastName: 'Castro',
          bio: 'Bailarina y yogui. Busco personas con energía positiva.',
          city: 'Santiago',
          gender: 'female',
          birthdate: new Date('1997-01-30'),
          latitude: -33.4600,
          longitude: -70.6620,
        },
      },
      interests: {
        create: [
          { interestId: salsa.id },
          { interestId: bachata.id },
          { interestId: yoga.id },
          { interestId: musica.id },
          { interestId: arte.id },
        ],
      },
    },
  });

  // User: Gabriel Torres
  const gabriel = await prisma.user.create({
    data: {
      email: 'gabriel@biktus.local',
      passwordHash: password,
      username: 'gabriel',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Gabriel',
          lastName: 'Torres',
          bio: 'Chef aficionado. Teatro y gastronomía son mi vida.',
          city: 'Santiago',
          gender: 'male',
          birthdate: new Date('1985-09-12'),
          latitude: -33.4300,
          longitude: -70.6450,
        },
      },
      interests: {
        create: [
          { interestId: gastronomia.id },
          { interestId: teatro.id },
          { interestId: comedia.id },
          { interestId: cine.id },
          { interestId: juegosMesa.id },
        ],
      },
    },
  });

  // User: Isabela Ramos
  const isabela = await prisma.user.create({
    data: {
      email: 'isabela@biktus.local',
      passwordHash: password,
      username: 'isabela',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Isabela',
          lastName: 'Ramos',
          bio: 'Corredora y amante del aire libre. Siempre lista para una aventura.',
          city: 'Santiago',
          gender: 'female',
          birthdate: new Date('1993-06-25'),
          latitude: -33.4480,
          longitude: -70.6700,
        },
      },
      interests: {
        create: [
          { interestId: running.id },
          { interestId: trekking.id },
          { interestId: ciclismo.id },
          { interestId: fitness.id },
          { interestId: voluntariado.id },
        ],
      },
    },
  });

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@biktus.local',
      passwordHash: password,
      username: 'admin',
      roles: ['USER', 'ADMIN'],
      profile: { create: { firstName: 'Admin', lastName: 'Biktus' } },
    },
  });

  // ── Activities ─────────────────────────────────────────────────────────────

  // Main test activity — Yoga (Valentina's)
  const yogaActivity = await prisma.activity.create({
    data: {
      slug: 'yoga-y-meditacion-biktus',
      title: 'Yoga y Meditación',
      type: 'wellness',
      description: 'Clases semanales de yoga y meditación para todos los niveles. Un espacio de conexión y bienestar.',
      createdById: valentina.id,
      interests: {
        create: [
          { interestId: yoga.id },
          { interestId: meditacion.id },
        ],
      },
    },
  });

  // Second activity — Teatro
  const teatroActivity = await prisma.activity.create({
    data: {
      slug: 'taller-teatro-impro',
      title: 'Taller de Improvisación Teatral',
      type: 'theater',
      description: 'Taller intensivo de improvisación para principiantes y avanzados',
      createdById: valentina.id,
      interests: {
        create: [
          { interestId: teatro.id },
          { interestId: comedia.id },
          { interestId: arte.id },
        ],
      },
    },
  });

  // Third activity — Trekking
  const trekkingActivity = await prisma.activity.create({
    data: {
      slug: 'trekking-cajon-maipo',
      title: 'Trekking Cajón del Maipo',
      type: 'trekking',
      description: 'Ruta de trekking por el Cajón del Maipo con guía experto',
      createdById: valentina.id,
      interests: {
        create: [
          { interestId: trekking.id },
          { interestId: senderismo.id },
        ],
      },
    },
  });

  // ── Sessions ───────────────────────────────────────────────────────────────

  const yogaSession = await prisma.activitySession.create({
    data: {
      activityId: yogaActivity.id,
      startsAt: new Date('2026-04-20T10:00:00Z'),
      endsAt: new Date('2026-04-20T11:30:00Z'),
      capacity: 12,
      priceCents: 12000,
      locationName: 'Estudio Zen, Providencia',
      latitude: -33.4350,
      longitude: -70.6270,
    },
  });

  const teatroSession = await prisma.activitySession.create({
    data: {
      activityId: teatroActivity.id,
      startsAt: new Date('2026-04-25T19:00:00Z'),
      endsAt: new Date('2026-04-25T21:00:00Z'),
      capacity: 15,
      priceCents: 18000,
      locationName: 'Teatro Mori, Bellavista',
      latitude: -33.4283,
      longitude: -70.6412,
    },
  });

  const trekkingSession = await prisma.activitySession.create({
    data: {
      activityId: trekkingActivity.id,
      startsAt: new Date('2026-05-03T08:00:00Z'),
      endsAt: new Date('2026-05-03T17:00:00Z'),
      capacity: 10,
      priceCents: 25000,
      locationName: 'Cajón del Maipo, punto de encuentro',
      latitude: -33.6000,
      longitude: -70.3800,
    },
  });

  // ── Enrollments ────────────────────────────────────────────────────────────
  // Yoga session: 4 users enrolled (2 paid, 2 pending)
  const e_ana_yoga = await prisma.activityEnrollment.create({
    data: { sessionId: yogaSession.id, userId: ana.id, status: 'confirmed', paymentStatus: 'paid' },
  });
  const e_fernanda_yoga = await prisma.activityEnrollment.create({
    data: { sessionId: yogaSession.id, userId: fernanda.id, status: 'confirmed', paymentStatus: 'paid' },
  });
  const e_bruno_yoga = await prisma.activityEnrollment.create({
    data: { sessionId: yogaSession.id, userId: bruno.id, status: 'pending', paymentStatus: 'pending_payment' },
  });
  const e_isabela_yoga = await prisma.activityEnrollment.create({
    data: { sessionId: yogaSession.id, userId: isabela.id, status: 'pending', paymentStatus: 'pending_payment' },
  });

  // Teatro session: 2 enrolled
  const e_ana_teatro = await prisma.activityEnrollment.create({
    data: { sessionId: teatroSession.id, userId: ana.id, status: 'confirmed', paymentStatus: 'paid' },
  });
  const e_gabriel_teatro = await prisma.activityEnrollment.create({
    data: { sessionId: teatroSession.id, userId: gabriel.id, status: 'confirmed', paymentStatus: 'pending_payment' },
  });

  // Trekking: 2 enrolled
  const e_diego_trekking = await prisma.activityEnrollment.create({
    data: { sessionId: trekkingSession.id, userId: diego.id, status: 'confirmed', paymentStatus: 'paid' },
  });
  const e_isabela_trekking = await prisma.activityEnrollment.create({
    data: { sessionId: trekkingSession.id, userId: isabela.id, status: 'pending', paymentStatus: 'pending_payment' },
  });

  // ── Payments ───────────────────────────────────────────────────────────────
  await prisma.payment.create({
    data: {
      userId: ana.id,
      activityId: yogaActivity.id,
      enrollmentId: e_ana_yoga.id,
      leaderId: valentina.id,
      totalAmount: 12000,
      platformFee: 0,
      leaderAmount: 12000,
      mpPaymentId: 'seed-pay-001',
      mpStatus: 'approved',
      status: 'completed',
      transferStatus: 'pending',
      paidAt: new Date(),
    },
  });
  await prisma.payment.create({
    data: {
      userId: fernanda.id,
      activityId: yogaActivity.id,
      enrollmentId: e_fernanda_yoga.id,
      leaderId: valentina.id,
      totalAmount: 12000,
      platformFee: 0,
      leaderAmount: 12000,
      mpPaymentId: 'seed-pay-002',
      mpStatus: 'approved',
      status: 'completed',
      transferStatus: 'transferred',
      paidAt: new Date(),
      transferredAt: new Date(),
    },
  });

  // ── Swipes ─────────────────────────────────────────────────────────────────
  // Global swipes (no session)
  await prisma.swipeEvent.createMany({
    data: [
      { byUserId: ana.id,     toUserId: bruno.id,    action: 'LIKE' },
      { byUserId: bruno.id,   toUserId: ana.id,      action: 'LIKE' },
      { byUserId: fernanda.id,toUserId: diego.id,    action: 'LIKE' },
      { byUserId: diego.id,   toUserId: fernanda.id, action: 'LIKE' },
      { byUserId: gabriel.id, toUserId: ana.id,      action: 'LIKE' },
    ],
  });

  // Session swipes — yoga session
  await prisma.swipeEvent.createMany({
    data: [
      { byUserId: ana.id,     toUserId: fernanda.id, sessionId: yogaSession.id, action: 'LIKE' },
      { byUserId: fernanda.id,toUserId: ana.id,      sessionId: yogaSession.id, action: 'LIKE' },
      { byUserId: bruno.id,   toUserId: isabela.id,  sessionId: yogaSession.id, action: 'LIKE' },
    ],
  });

  // ── Matches ────────────────────────────────────────────────────────────────
  const mkPair = (a, b) => (a.id < b.id ? [a.id, b.id] : [b.id, a.id]);

  const [uA1, uB1] = mkPair(ana, bruno);
  const [uA2, uB2] = mkPair(fernanda, diego);
  const [uA3, uB3] = mkPair(ana, fernanda);

  await prisma.match.createMany({
    data: [
      { userAId: uA1, userBId: uB1 },                                          // global
      { userAId: uA2, userBId: uB2 },                                          // global
      { userAId: uA3, userBId: uB3, sessionId: yogaSession.id },               // session
    ],
  });

  // ── Notifications ──────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      // Valentina (lider) — payment and enrollment notifications
      {
        userId: valentina.id,
        type: 'new_enrollment',
        title: 'Nueva inscripción',
        body: 'Ana Silva se inscribió en Yoga y Meditación',
        metadata: { enrollmentId: e_ana_yoga.id, sessionId: yogaSession.id },
      },
      {
        userId: valentina.id,
        type: 'payment_confirmed',
        title: 'Pago recibido',
        body: 'Ana Silva pagó $12.000 por Yoga y Meditación',
        isRead: false,
        metadata: { enrollmentId: e_ana_yoga.id },
      },
      {
        userId: valentina.id,
        type: 'new_enrollment',
        title: 'Nueva inscripción',
        body: 'Bruno Pérez se inscribió en Yoga y Meditación — pago pendiente',
        isRead: false,
        metadata: { enrollmentId: e_bruno_yoga.id, sessionId: yogaSession.id },
      },
      {
        userId: valentina.id,
        type: 'new_enrollment',
        title: 'Nueva inscripción',
        body: 'Isabela Ramos se inscribió en Yoga y Meditación — pago pendiente',
        isRead: false,
        metadata: { enrollmentId: e_isabela_yoga.id, sessionId: yogaSession.id },
      },
      // Ana — match & payment notifications
      {
        userId: ana.id,
        type: 'match_created',
        title: '¡Nuevo match!',
        body: 'Hiciste match con Bruno Pérez',
        isRead: false,
      },
      {
        userId: ana.id,
        type: 'match_created',
        title: '¡Nuevo match!',
        body: 'Hiciste match con Fernanda Castro en Yoga y Meditación',
        isRead: false,
        metadata: { sessionId: yogaSession.id },
      },
      {
        userId: ana.id,
        type: 'payment_confirmed',
        title: 'Pago confirmado',
        body: 'Tu pago de Yoga y Meditación fue confirmado.',
        isRead: true,
      },
      // Bruno — payment pending reminder
      {
        userId: bruno.id,
        type: 'payment_received',
        title: 'Recordatorio de pago',
        body: 'Tienes un pago pendiente para Yoga y Meditación.',
        isRead: false,
        metadata: { sessionId: yogaSession.id },
      },
      // Isabela — payment pending
      {
        userId: isabela.id,
        type: 'payment_received',
        title: 'Recordatorio de pago',
        body: 'Tienes un pago pendiente para Yoga y Meditación.',
        isRead: false,
        metadata: { sessionId: yogaSession.id },
      },
      // Fernanda — match
      {
        userId: fernanda.id,
        type: 'match_created',
        title: '¡Nuevo match!',
        body: 'Hiciste match con Diego Morales',
        isRead: false,
      },
    ],
  });

  // ── Bank info ──────────────────────────────────────────────────────────────
  await prisma.leaderBankInfo.create({
    data: {
      userId: valentina.id,
      rut: '12.345.678-9',
      holderName: 'Valentina Reyes',
      bankName: 'BancoEstado',
      accountType: 'cuenta_vista',
      accountNumber: '12345678',
      email: 'lider@biktus.local',
    },
  });

  console.log('\n✅ Seed completado\n');
  console.log('Usuarios (contraseña: password123)');
  console.log('  lider@biktus.local    → Valentina Reyes (COMMUNITY_LEADER)');
  console.log('  ana@biktus.local      → Ana Silva');
  console.log('  bruno@biktus.local    → Bruno Pérez');
  console.log('  diego@biktus.local    → Diego Morales');
  console.log('  fernanda@biktus.local → Fernanda Castro');
  console.log('  gabriel@biktus.local  → Gabriel Torres');
  console.log('  isabela@biktus.local  → Isabela Ramos');
  console.log('  admin@biktus.local    → Admin');
  console.log('\nActividades de Valentina:');
  console.log(`  Yoga y Meditación       (yogaSession: ${yogaSession.id})`);
  console.log(`  Teatro Improvisación    (teatroSession: ${teatroSession.id})`);
  console.log(`  Trekking Cajón del Maipo(trekkingSession: ${trekkingSession.id})`);
  console.log('\nInscritos con pago pendiente (yoga): Bruno, Isabela');
  console.log('Matches globales: Ana↔Bruno, Fernanda↔Diego');
  console.log('Match de sesión: Ana↔Fernanda (yoga)\n');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
