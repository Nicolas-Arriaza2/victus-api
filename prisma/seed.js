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
    { name: 'Salsa',           slug: 'salsa'           },
    { name: 'Bachata',         slug: 'bachata'         },
    { name: 'Tango',           slug: 'tango'           },
    { name: 'Reggaetón',       slug: 'reggaeton'       },
    { name: 'Folclore',        slug: 'folclore'        },
    { name: 'Música',          slug: 'musica'          },
    // Deporte & Naturaleza
    { name: 'Trekking',        slug: 'trekking'        },
    { name: 'Senderismo',      slug: 'senderismo'      },
    { name: 'Escalada',        slug: 'escalada'        },
    { name: 'Ciclismo',        slug: 'ciclismo'        },
    { name: 'Running',         slug: 'running'         },
    { name: 'Surf',            slug: 'surf'            },
    // Artes & Escena
    { name: 'Teatro',          slug: 'teatro'          },
    { name: 'Comedia',         slug: 'comedia'         },
    { name: 'Fotografía',      slug: 'fotografia'      },
    { name: 'Arte',            slug: 'arte'            },
    { name: 'Cine',            slug: 'cine'            },
    // Social & Grupal
    { name: 'Juegos de mesa',  slug: 'juegos-de-mesa'  },
    { name: 'Asados',          slug: 'asados'          },
    { name: 'Voluntariado',    slug: 'voluntariado'    },
    { name: 'Viajes grupales', slug: 'viajes-grupales' },
    // Bienestar
    { name: 'Yoga',            slug: 'yoga'            },
    { name: 'Fitness',         slug: 'fitness'         },
    { name: 'Meditación',      slug: 'meditacion'      },
    { name: 'Gastronomía',     slug: 'gastronomia'     },
  ];

  const allInterests = await Promise.all(
    interestData.map((d) => prisma.interest.create({ data: d })),
  );

  const bySlug = Object.fromEntries(allInterests.map((i) => [i.slug, i]));

  const {
    salsa, bachata, tango, reggaeton, musica, folclore,
    trekking, senderismo, escalada, ciclismo, running, surf,
    teatro, comedia, fotografia, arte, cine,
    'juegos-de-mesa': juegosMesa, asados, voluntariado, 'viajes-grupales': viajesGrupales,
    yoga, fitness, meditacion, gastronomia,
  } = bySlug;

  const password = await argon2.hash('password123');

  // ── Photo URL helpers ──────────────────────────────────────────────────────
  const wp = (n) => `https://randomuser.me/api/portraits/women/${n}.jpg`;
  const mp = (n) => `https://randomuser.me/api/portraits/men/${n}.jpg`;

  // ── Users ──────────────────────────────────────────────────────────────────

  // MAIN LEADER — Valentina Reyes (lider@biktus.local)
  const valentina = await prisma.user.create({
    data: {
      email: 'lider@biktus.local',
      passwordHash: password,
      username: 'valentina_reyes',
      roles: ['USER', 'COMMUNITY_LEADER'],
      profile: {
        create: {
          firstName: 'Valentina',
          lastName: 'Reyes',
          bio: 'Instructora certificada de yoga y meditación 🧘‍♀️ Me apasiona crear espacios seguros donde las personas se conecten con su bienestar. Amo el baile, la naturaleza y compartir experiencias que transforman.',
          city: 'Santiago',
          gender: 'female',
          genderDetails: ['Mujer cisgénero'],
          sexualOrientation: ['Heterosexual'],
          showGender: true,
          showOrientation: true,
          birthdate: new Date('1990-03-15'),
          avatarUrl: wp(10),
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
          { interestId: trekking.id },
          { interestId: arte.id },
        ],
      },
    },
  });

  // Photos for Valentina
  await prisma.userPhoto.createMany({
    data: [
      { userId: valentina.id, url: wp(10), position: 0, format: 'jpg' },
      { userId: valentina.id, url: wp(11), position: 1, format: 'jpg' },
      { userId: valentina.id, url: wp(12), position: 2, format: 'jpg' },
    ],
  });

  // User: Ana Silva
  const ana = await prisma.user.create({
    data: {
      email: 'ana@biktus.local',
      passwordHash: password,
      username: 'ana_silva',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Ana',
          lastName: 'Silva',
          bio: 'Actriz amateur y fotógrafa urbana. Siempre lista para explorar nuevos escenarios y capturar momentos únicos. El teatro me cambió la vida.',
          city: 'Santiago',
          gender: 'female',
          genderDetails: ['Mujer cisgénero'],
          sexualOrientation: ['Bisexual'],
          showGender: true,
          showOrientation: false,
          birthdate: new Date('1995-07-22'),
          avatarUrl: wp(20),
          latitude: -33.4420,
          longitude: -70.6580,
        },
      },
      interests: {
        create: [
          { interestId: teatro.id },
          { interestId: fotografia.id },
          { interestId: arte.id },
          { interestId: yoga.id },
          { interestId: trekking.id },
          { interestId: cine.id },
        ],
      },
    },
  });

  await prisma.userPhoto.createMany({
    data: [
      { userId: ana.id, url: wp(20), position: 0, format: 'jpg' },
      { userId: ana.id, url: wp(21), position: 1, format: 'jpg' },
      { userId: ana.id, url: wp(22), position: 2, format: 'jpg' },
    ],
  });

  // User: Bruno Pérez
  const bruno = await prisma.user.create({
    data: {
      email: 'bruno@biktus.local',
      passwordHash: password,
      username: 'bruno_perez',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Bruno',
          lastName: 'Pérez',
          bio: 'Maratonista y chef aficionado. Creo que el mejor plan es sudar en una carrera y después comer rico con amigos. También hago asados legendarios 🔥',
          city: 'Santiago',
          gender: 'male',
          genderDetails: ['Hombre cisgénero'],
          sexualOrientation: ['Heterosexual'],
          showGender: true,
          showOrientation: true,
          birthdate: new Date('1992-11-08'),
          avatarUrl: mp(20),
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
          { interestId: ciclismo.id },
        ],
      },
    },
  });

  await prisma.userPhoto.createMany({
    data: [
      { userId: bruno.id, url: mp(20), position: 0, format: 'jpg' },
      { userId: bruno.id, url: mp(21), position: 1, format: 'jpg' },
    ],
  });

  // User: Diego Morales
  const diego = await prisma.user.create({
    data: {
      email: 'diego@biktus.local',
      passwordHash: password,
      username: 'diego_morales',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Diego',
          lastName: 'Morales',
          bio: 'Guitarrista y montañero. Los fines de semana me encuentras en algún cerro o improvisando música con amigos. La naturaleza y el rock son mi religión.',
          city: 'Santiago',
          gender: 'male',
          genderDetails: ['Hombre cisgénero'],
          sexualOrientation: ['Heterosexual'],
          showGender: true,
          showOrientation: true,
          birthdate: new Date('1988-04-14'),
          avatarUrl: mp(30),
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
          { interestId: fotografia.id },
        ],
      },
    },
  });

  await prisma.userPhoto.createMany({
    data: [
      { userId: diego.id, url: mp(30), position: 0, format: 'jpg' },
      { userId: diego.id, url: mp(31), position: 1, format: 'jpg' },
      { userId: diego.id, url: mp(32), position: 2, format: 'jpg' },
    ],
  });

  // User: Fernanda Castro
  const fernanda = await prisma.user.create({
    data: {
      email: 'fernanda@biktus.local',
      passwordHash: password,
      username: 'fernanda_castro',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Fernanda',
          lastName: 'Castro',
          bio: 'Bailarina de salsa y bachata 💃 Llevo 8 años en esto y todavía no puedo parar. También practico yoga para equilibrar cuerpo y mente. Busco gente con energía positiva.',
          city: 'Santiago',
          gender: 'female',
          genderDetails: ['Mujer cisgénero'],
          sexualOrientation: ['Heterosexual'],
          showGender: true,
          showOrientation: true,
          birthdate: new Date('1997-01-30'),
          avatarUrl: wp(30),
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
          { interestId: viajesGrupales.id },
        ],
      },
    },
  });

  await prisma.userPhoto.createMany({
    data: [
      { userId: fernanda.id, url: wp(30), position: 0, format: 'jpg' },
      { userId: fernanda.id, url: wp(31), position: 1, format: 'jpg' },
      { userId: fernanda.id, url: wp(32), position: 2, format: 'jpg' },
    ],
  });

  // User: Gabriel Torres
  const gabriel = await prisma.user.create({
    data: {
      email: 'gabriel@biktus.local',
      passwordHash: password,
      username: 'gabriel_torres',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Gabriel',
          lastName: 'Torres',
          bio: 'Chef y actor amateur. El teatro me enseñó a vivir el momento; la gastronomía me enseñó a celebrarlo. Los domingos organizo asados épicos con improvisación teatral incluida 🎭',
          city: 'Santiago',
          gender: 'male',
          genderDetails: ['Hombre cisgénero'],
          sexualOrientation: ['Heterosexual'],
          showGender: true,
          showOrientation: true,
          birthdate: new Date('1985-09-12'),
          avatarUrl: mp(40),
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
          { interestId: asados.id },
        ],
      },
    },
  });

  await prisma.userPhoto.createMany({
    data: [
      { userId: gabriel.id, url: mp(40), position: 0, format: 'jpg' },
      { userId: gabriel.id, url: mp(41), position: 1, format: 'jpg' },
    ],
  });

  // User: Isabela Ramos
  const isabela = await prisma.user.create({
    data: {
      email: 'isabela@biktus.local',
      passwordHash: password,
      username: 'isabela_ramos',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Isabela',
          lastName: 'Ramos',
          bio: 'Corredora de maratón y cicloturista. Siempre busco el próximo desafío. El voluntariado es parte de mi vida — creo que el deporte tiene más sentido cuando ayuda a otros.',
          city: 'Santiago',
          gender: 'female',
          genderDetails: ['Mujer cisgénero'],
          sexualOrientation: ['Heterosexual'],
          showGender: true,
          showOrientation: true,
          birthdate: new Date('1993-06-25'),
          avatarUrl: wp(40),
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
          { interestId: senderismo.id },
        ],
      },
    },
  });

  await prisma.userPhoto.createMany({
    data: [
      { userId: isabela.id, url: wp(40), position: 0, format: 'jpg' },
      { userId: isabela.id, url: wp(41), position: 1, format: 'jpg' },
      { userId: isabela.id, url: wp(42), position: 2, format: 'jpg' },
    ],
  });

  // Extra swipe users (solo foto, menos detalles)
  const camila = await prisma.user.create({
    data: {
      email: 'camila@biktus.local',
      passwordHash: password,
      username: 'camila_m',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Camila',
          lastName: 'Mendoza',
          bio: 'Diseñadora gráfica y amante del surf 🏄‍♀️ Fotógrafa de naturaleza en mis ratos libres.',
          city: 'Valparaíso',
          gender: 'female',
          birthdate: new Date('1996-03-10'),
          avatarUrl: wp(50),
          latitude: -33.0458,
          longitude: -71.6197,
        },
      },
      interests: {
        create: [
          { interestId: surf.id },
          { interestId: fotografia.id },
          { interestId: arte.id },
          { interestId: running.id },
        ],
      },
    },
  });
  await prisma.userPhoto.createMany({
    data: [
      { userId: camila.id, url: wp(50), position: 0, format: 'jpg' },
      { userId: camila.id, url: wp(51), position: 1, format: 'jpg' },
    ],
  });

  const rodrigo = await prisma.user.create({
    data: {
      email: 'rodrigo@biktus.local',
      passwordHash: password,
      username: 'rodrigo_v',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Rodrigo',
          lastName: 'Vargas',
          bio: 'Ciclista urbano y amante de los viajes grupales. Me gusta conocer gente con ganas de explorar.',
          city: 'Santiago',
          gender: 'male',
          birthdate: new Date('1991-08-22'),
          avatarUrl: mp(50),
          latitude: -33.4500,
          longitude: -70.6600,
        },
      },
      interests: {
        create: [
          { interestId: ciclismo.id },
          { interestId: viajesGrupales.id },
          { interestId: fotografia.id },
          { interestId: trekking.id },
        ],
      },
    },
  });
  await prisma.userPhoto.createMany({
    data: [
      { userId: rodrigo.id, url: mp(50), position: 0, format: 'jpg' },
      { userId: rodrigo.id, url: mp(51), position: 1, format: 'jpg' },
    ],
  });

  const sofia = await prisma.user.create({
    data: {
      email: 'sofia@biktus.local',
      passwordHash: password,
      username: 'sofia_b',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Sofía',
          lastName: 'Bravo',
          bio: 'Meditadora zen y profesora de pilates. Tango y folclore cuando el cuerpo lo pide.',
          city: 'Santiago',
          gender: 'female',
          birthdate: new Date('1989-12-05'),
          avatarUrl: wp(60),
          latitude: -33.4400,
          longitude: -70.6550,
        },
      },
      interests: {
        create: [
          { interestId: meditacion.id },
          { interestId: yoga.id },
          { interestId: tango.id },
          { interestId: folclore.id },
        ],
      },
    },
  });
  await prisma.userPhoto.createMany({
    data: [
      { userId: sofia.id, url: wp(60), position: 0, format: 'jpg' },
      { userId: sofia.id, url: wp(61), position: 1, format: 'jpg' },
    ],
  });

  const mateo = await prisma.user.create({
    data: {
      email: 'mateo@biktus.local',
      passwordHash: password,
      username: 'mateo_n',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Mateo',
          lastName: 'Núñez',
          bio: 'Escalador y amante del cine independiente. Busco aventuras y buenas conversaciones.',
          city: 'Santiago',
          gender: 'male',
          birthdate: new Date('1994-05-17'),
          avatarUrl: mp(60),
          latitude: -33.4350,
          longitude: -70.6500,
        },
      },
      interests: {
        create: [
          { interestId: escalada.id },
          { interestId: cine.id },
          { interestId: trekking.id },
          { interestId: juegosMesa.id },
        ],
      },
    },
  });
  await prisma.userPhoto.createMany({
    data: [
      { userId: mateo.id, url: mp(60), position: 0, format: 'jpg' },
      { userId: mateo.id, url: mp(61), position: 1, format: 'jpg' },
    ],
  });

  const lucia = await prisma.user.create({
    data: {
      email: 'lucia@biktus.local',
      passwordHash: password,
      username: 'lucia_p',
      roles: ['USER'],
      profile: {
        create: {
          firstName: 'Lucía',
          lastName: 'Pizarro',
          bio: 'Reggaetonera de corazón y voluntaria los fines de semana. La música me mueve, el voluntariado me completa.',
          city: 'Santiago',
          gender: 'female',
          birthdate: new Date('1998-09-28'),
          avatarUrl: wp(70),
          latitude: -33.4520,
          longitude: -70.6680,
        },
      },
      interests: {
        create: [
          { interestId: reggaeton.id },
          { interestId: voluntariado.id },
          { interestId: salsa.id },
          { interestId: fitness.id },
        ],
      },
    },
  });
  await prisma.userPhoto.createMany({
    data: [
      { userId: lucia.id, url: wp(70), position: 0, format: 'jpg' },
      { userId: lucia.id, url: wp(71), position: 1, format: 'jpg' },
    ],
  });

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@biktus.local',
      passwordHash: password,
      username: 'admin_biktus',
      roles: ['USER', 'ADMIN'],
      profile: { create: { firstName: 'Admin', lastName: 'Biktus' } },
    },
  });

  // ── Activities ─────────────────────────────────────────────────────────────

  // 1. Yoga y Meditación (Valentina's main)
  const yogaActivity = await prisma.activity.create({
    data: {
      slug: 'yoga-y-meditacion-biktus',
      title: 'Yoga y Meditación',
      type: 'wellness',
      description: 'Clases semanales de yoga y meditación para todos los niveles. Un espacio de conexión, bienestar y autoconocimiento. Incluye pranayama, asanas y cierre de meditación guiada.',
      createdById: valentina.id,
      interests: {
        create: [
          { interestId: yoga.id },
          { interestId: meditacion.id },
        ],
      },
    },
  });

  // 2. Teatro Improvisación
  const teatroActivity = await prisma.activity.create({
    data: {
      slug: 'taller-teatro-impro',
      title: 'Taller de Improvisación Teatral',
      type: 'theater',
      description: 'Taller intensivo de improvisación para principiantes y avanzados. Trabajamos presencia escénica, escucha activa y creatividad en tiempo real. ¡No se necesita experiencia previa!',
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

  // 3. Trekking Cajón del Maipo
  const trekkingActivity = await prisma.activity.create({
    data: {
      slug: 'trekking-cajon-maipo',
      title: 'Trekking Cajón del Maipo',
      type: 'trekking',
      description: 'Ruta de trekking por el Cajón del Maipo con guía experto. Recorremos senderos de dificultad media, con vistas a volcanes y ríos andinos. Incluye desayuno energético y seguro.',
      createdById: valentina.id,
      interests: {
        create: [
          { interestId: trekking.id },
          { interestId: senderismo.id },
        ],
      },
    },
  });

  // 4. Salsa & Bachata (NEW)
  const salsaActivity = await prisma.activity.create({
    data: {
      slug: 'salsa-y-bachata-biktus',
      title: 'Salsa & Bachata para Todos',
      type: 'dance',
      description: 'Clases grupales de salsa y bachata para principiantes e intermedios. Aprendemos pasos básicos, giros y combinaciones en un ambiente divertido y sin presión. ¡Pareja no requerida!',
      createdById: valentina.id,
      interests: {
        create: [
          { interestId: salsa.id },
          { interestId: bachata.id },
          { interestId: musica.id },
        ],
      },
    },
  });

  // 5. Fotografía Urbana (NEW)
  const fotografiaActivity = await prisma.activity.create({
    data: {
      slug: 'fotografia-urbana-santiago',
      title: 'Fotografía Urbana Santiago',
      type: 'art',
      description: 'Salidas fotográficas grupales por los barrios más interesantes de Santiago. Aprendemos composición, luz natural y edición básica. Trae tu cámara o usa el teléfono.',
      createdById: valentina.id,
      interests: {
        create: [
          { interestId: fotografia.id },
          { interestId: arte.id },
          { interestId: viajesGrupales.id },
        ],
      },
    },
  });

  // 6. Ciclismo Grupal (NEW)
  const ciclismoActivity = await prisma.activity.create({
    data: {
      slug: 'ciclismo-grupal-santiago',
      title: 'Ciclismo Grupal Santiago',
      type: 'outdoor',
      description: 'Rutas en bicicleta por Santiago y alrededores. Salidas de nivel intermedio por ciclovías y parques urbanos. Incluye parada en café y punto de encuentro cercano al metro.',
      createdById: valentina.id,
      interests: {
        create: [
          { interestId: ciclismo.id },
          { interestId: running.id },
          { interestId: voluntariado.id },
        ],
      },
    },
  });

  // ── Sessions ───────────────────────────────────────────────────────────────

  // Yoga — 3 sessions
  const yogaSession1 = await prisma.activitySession.create({
    data: {
      activityId: yogaActivity.id,
      startsAt: new Date('2026-04-20T10:00:00Z'),
      endsAt:   new Date('2026-04-20T11:30:00Z'),
      capacity: 12,
      priceCents: 12000,
      locationName: 'Estudio Zen, Providencia',
      latitude: -33.4350,
      longitude: -70.6270,
    },
  });

  const yogaSession2 = await prisma.activitySession.create({
    data: {
      activityId: yogaActivity.id,
      startsAt: new Date('2026-04-27T10:00:00Z'),
      endsAt:   new Date('2026-04-27T11:30:00Z'),
      capacity: 12,
      priceCents: 12000,
      locationName: 'Estudio Zen, Providencia',
      latitude: -33.4350,
      longitude: -70.6270,
    },
  });

  const yogaSession3 = await prisma.activitySession.create({
    data: {
      activityId: yogaActivity.id,
      startsAt: new Date('2026-05-04T10:00:00Z'),
      endsAt:   new Date('2026-05-04T11:30:00Z'),
      capacity: 12,
      priceCents: 12000,
      locationName: 'Estudio Zen, Providencia',
      latitude: -33.4350,
      longitude: -70.6270,
    },
  });

  // Teatro — 2 sessions
  const teatroSession1 = await prisma.activitySession.create({
    data: {
      activityId: teatroActivity.id,
      startsAt: new Date('2026-04-25T19:00:00Z'),
      endsAt:   new Date('2026-04-25T21:00:00Z'),
      capacity: 15,
      priceCents: 18000,
      locationName: 'Teatro Mori, Bellavista',
      latitude: -33.4283,
      longitude: -70.6412,
    },
  });

  const teatroSession2 = await prisma.activitySession.create({
    data: {
      activityId: teatroActivity.id,
      startsAt: new Date('2026-05-09T19:00:00Z'),
      endsAt:   new Date('2026-05-09T21:00:00Z'),
      capacity: 15,
      priceCents: 18000,
      locationName: 'Teatro Mori, Bellavista',
      latitude: -33.4283,
      longitude: -70.6412,
    },
  });

  // Trekking — 2 sessions
  const trekkingSession1 = await prisma.activitySession.create({
    data: {
      activityId: trekkingActivity.id,
      startsAt: new Date('2026-05-03T08:00:00Z'),
      endsAt:   new Date('2026-05-03T17:00:00Z'),
      capacity: 10,
      priceCents: 25000,
      locationName: 'Cajón del Maipo, punto de encuentro',
      latitude: -33.6000,
      longitude: -70.3800,
    },
  });

  const trekkingSession2 = await prisma.activitySession.create({
    data: {
      activityId: trekkingActivity.id,
      startsAt: new Date('2026-05-17T08:00:00Z'),
      endsAt:   new Date('2026-05-17T17:00:00Z'),
      capacity: 10,
      priceCents: 25000,
      locationName: 'Cajón del Maipo, punto de encuentro',
      latitude: -33.6000,
      longitude: -70.3800,
    },
  });

  // Salsa & Bachata — 2 sessions
  const salsaSession1 = await prisma.activitySession.create({
    data: {
      activityId: salsaActivity.id,
      startsAt: new Date('2026-04-22T20:00:00Z'),
      endsAt:   new Date('2026-04-22T22:00:00Z'),
      capacity: 20,
      priceCents: 15000,
      locationName: 'Studio Dance, Las Condes',
      latitude: -33.4100,
      longitude: -70.5700,
    },
  });

  const salsaSession2 = await prisma.activitySession.create({
    data: {
      activityId: salsaActivity.id,
      startsAt: new Date('2026-04-29T20:00:00Z'),
      endsAt:   new Date('2026-04-29T22:00:00Z'),
      capacity: 20,
      priceCents: 15000,
      locationName: 'Studio Dance, Las Condes',
      latitude: -33.4100,
      longitude: -70.5700,
    },
  });

  // Fotografía Urbana — 2 sessions
  const fotografiaSession1 = await prisma.activitySession.create({
    data: {
      activityId: fotografiaActivity.id,
      startsAt: new Date('2026-04-26T09:00:00Z'),
      endsAt:   new Date('2026-04-26T13:00:00Z'),
      capacity: 12,
      priceCents: 20000,
      locationName: 'Barrio Lastarria, punto de encuentro en Plaza Mulato Gil',
      latitude: -33.4378,
      longitude: -70.6390,
    },
  });

  const fotografiaSession2 = await prisma.activitySession.create({
    data: {
      activityId: fotografiaActivity.id,
      startsAt: new Date('2026-05-10T09:00:00Z'),
      endsAt:   new Date('2026-05-10T13:00:00Z'),
      capacity: 12,
      priceCents: 20000,
      locationName: 'Barrio Italia, punto de encuentro frente al Mercado Persa',
      latitude: -33.4500,
      longitude: -70.6350,
    },
  });

  // Ciclismo — 2 sessions
  const ciclismoSession1 = await prisma.activitySession.create({
    data: {
      activityId: ciclismoActivity.id,
      startsAt: new Date('2026-05-02T08:30:00Z'),
      endsAt:   new Date('2026-05-02T12:00:00Z'),
      capacity: 15,
      priceCents: 10000,
      locationName: 'Parque Balmaceda, entrada principal',
      latitude: -33.4450,
      longitude: -70.6380,
    },
  });

  const ciclismoSession2 = await prisma.activitySession.create({
    data: {
      activityId: ciclismoActivity.id,
      startsAt: new Date('2026-05-16T08:30:00Z'),
      endsAt:   new Date('2026-05-16T12:00:00Z'),
      capacity: 15,
      priceCents: 10000,
      locationName: 'Parque Balmaceda, entrada principal',
      latitude: -33.4450,
      longitude: -70.6380,
    },
  });

  // ── Enrollments ────────────────────────────────────────────────────────────

  // Yoga session 1: 5 users enrolled
  const e_ana_yoga1       = await prisma.activityEnrollment.create({ data: { sessionId: yogaSession1.id, userId: ana.id,      status: 'confirmed', paymentStatus: 'paid'            } });
  const e_fernanda_yoga1  = await prisma.activityEnrollment.create({ data: { sessionId: yogaSession1.id, userId: fernanda.id,  status: 'confirmed', paymentStatus: 'paid'            } });
  const e_bruno_yoga1     = await prisma.activityEnrollment.create({ data: { sessionId: yogaSession1.id, userId: bruno.id,    status: 'pending',   paymentStatus: 'pending_payment' } });
  const e_isabela_yoga1   = await prisma.activityEnrollment.create({ data: { sessionId: yogaSession1.id, userId: isabela.id,  status: 'pending',   paymentStatus: 'pending_payment' } });
  const e_sofia_yoga1     = await prisma.activityEnrollment.create({ data: { sessionId: yogaSession1.id, userId: sofia.id,    status: 'confirmed', paymentStatus: 'paid'            } });

  // Yoga session 2: 3 users
  const e_camila_yoga2    = await prisma.activityEnrollment.create({ data: { sessionId: yogaSession2.id, userId: camila.id,   status: 'confirmed', paymentStatus: 'paid'            } });
  const e_lucia_yoga2     = await prisma.activityEnrollment.create({ data: { sessionId: yogaSession2.id, userId: lucia.id,    status: 'pending',   paymentStatus: 'pending_payment' } });

  // Teatro session 1: 3 enrolled
  const e_ana_teatro1     = await prisma.activityEnrollment.create({ data: { sessionId: teatroSession1.id, userId: ana.id,     status: 'confirmed', paymentStatus: 'paid'            } });
  const e_gabriel_teatro1 = await prisma.activityEnrollment.create({ data: { sessionId: teatroSession1.id, userId: gabriel.id, status: 'confirmed', paymentStatus: 'pending_payment' } });
  const e_mateo_teatro1   = await prisma.activityEnrollment.create({ data: { sessionId: teatroSession1.id, userId: mateo.id,   status: 'pending',   paymentStatus: 'pending_payment' } });

  // Trekking session 1: 3 enrolled
  const e_diego_trekking1   = await prisma.activityEnrollment.create({ data: { sessionId: trekkingSession1.id, userId: diego.id,   status: 'confirmed', paymentStatus: 'paid'            } });
  const e_isabela_trekking1 = await prisma.activityEnrollment.create({ data: { sessionId: trekkingSession1.id, userId: isabela.id, status: 'pending',   paymentStatus: 'pending_payment' } });
  const e_rodrigo_trekking1 = await prisma.activityEnrollment.create({ data: { sessionId: trekkingSession1.id, userId: rodrigo.id, status: 'confirmed', paymentStatus: 'paid'            } });

  // Salsa session 1: 4 enrolled
  const e_fernanda_salsa1 = await prisma.activityEnrollment.create({ data: { sessionId: salsaSession1.id, userId: fernanda.id, status: 'confirmed', paymentStatus: 'paid'            } });
  const e_ana_salsa1      = await prisma.activityEnrollment.create({ data: { sessionId: salsaSession1.id, userId: ana.id,      status: 'confirmed', paymentStatus: 'paid'            } });
  const e_lucia_salsa1    = await prisma.activityEnrollment.create({ data: { sessionId: salsaSession1.id, userId: lucia.id,    status: 'confirmed', paymentStatus: 'paid'            } });
  const e_diego_salsa1    = await prisma.activityEnrollment.create({ data: { sessionId: salsaSession1.id, userId: diego.id,    status: 'pending',   paymentStatus: 'pending_payment' } });

  // Fotografía session 1: 3 enrolled
  const e_ana_foto1     = await prisma.activityEnrollment.create({ data: { sessionId: fotografiaSession1.id, userId: ana.id,    status: 'confirmed', paymentStatus: 'paid'            } });
  const e_diego_foto1   = await prisma.activityEnrollment.create({ data: { sessionId: fotografiaSession1.id, userId: diego.id,  status: 'confirmed', paymentStatus: 'paid'            } });
  const e_camila_foto1  = await prisma.activityEnrollment.create({ data: { sessionId: fotografiaSession1.id, userId: camila.id, status: 'pending',   paymentStatus: 'pending_payment' } });

  // Ciclismo session 1: 3 enrolled
  const e_isabela_cicl1 = await prisma.activityEnrollment.create({ data: { sessionId: ciclismoSession1.id, userId: isabela.id, status: 'confirmed', paymentStatus: 'paid'            } });
  const e_rodrigo_cicl1 = await prisma.activityEnrollment.create({ data: { sessionId: ciclismoSession1.id, userId: rodrigo.id, status: 'confirmed', paymentStatus: 'paid'            } });
  const e_bruno_cicl1   = await prisma.activityEnrollment.create({ data: { sessionId: ciclismoSession1.id, userId: bruno.id,   status: 'pending',   paymentStatus: 'pending_payment' } });

  // ── Payments ───────────────────────────────────────────────────────────────
  const mkPay = (userId, activityId, enrollmentId, amount, payId, transferred = false) =>
    prisma.payment.create({
      data: {
        userId, activityId, enrollmentId,
        leaderId: valentina.id,
        totalAmount: amount, platformFee: 0, leaderAmount: amount,
        mpPaymentId: payId, mpStatus: 'approved',
        status: 'completed',
        transferStatus: transferred ? 'transferred' : 'pending',
        paidAt: new Date(),
        ...(transferred ? { transferredAt: new Date() } : {}),
      },
    });

  await mkPay(ana.id,     yogaActivity.id, e_ana_yoga1.id,      12000, 'seed-pay-001', true);
  await mkPay(fernanda.id,yogaActivity.id, e_fernanda_yoga1.id, 12000, 'seed-pay-002', true);
  await mkPay(sofia.id,   yogaActivity.id, e_sofia_yoga1.id,    12000, 'seed-pay-003');
  await mkPay(camila.id,  yogaActivity.id, e_camila_yoga2.id,   12000, 'seed-pay-004');
  await mkPay(ana.id,     teatroActivity.id,    e_ana_teatro1.id,   18000, 'seed-pay-005', true);
  await mkPay(diego.id,   trekkingActivity.id,  e_diego_trekking1.id, 25000, 'seed-pay-006');
  await mkPay(rodrigo.id, trekkingActivity.id,  e_rodrigo_trekking1.id, 25000, 'seed-pay-007', true);
  await mkPay(fernanda.id,salsaActivity.id, e_fernanda_salsa1.id, 15000, 'seed-pay-008', true);
  await mkPay(ana.id,     salsaActivity.id, e_ana_salsa1.id,     15000, 'seed-pay-009');
  await mkPay(lucia.id,   salsaActivity.id, e_lucia_salsa1.id,   15000, 'seed-pay-010');
  await mkPay(ana.id,     fotografiaActivity.id, e_ana_foto1.id,   20000, 'seed-pay-011');
  await mkPay(diego.id,   fotografiaActivity.id, e_diego_foto1.id, 20000, 'seed-pay-012');
  await mkPay(isabela.id, ciclismoActivity.id, e_isabela_cicl1.id, 10000, 'seed-pay-013');
  await mkPay(rodrigo.id, ciclismoActivity.id, e_rodrigo_cicl1.id, 10000, 'seed-pay-014', true);

  // ── Swipes ─────────────────────────────────────────────────────────────────
  await prisma.swipeEvent.createMany({
    data: [
      // Global swipes
      { byUserId: ana.id,      toUserId: bruno.id,    action: 'LIKE' },
      { byUserId: bruno.id,    toUserId: ana.id,      action: 'LIKE' },
      { byUserId: fernanda.id, toUserId: diego.id,    action: 'LIKE' },
      { byUserId: diego.id,    toUserId: fernanda.id, action: 'LIKE' },
      { byUserId: gabriel.id,  toUserId: ana.id,      action: 'LIKE' },
      { byUserId: ana.id,      toUserId: gabriel.id,  action: 'LIKE' },
      { byUserId: camila.id,   toUserId: rodrigo.id,  action: 'LIKE' },
      { byUserId: rodrigo.id,  toUserId: camila.id,   action: 'LIKE' },
      { byUserId: sofia.id,    toUserId: mateo.id,    action: 'LIKE' },
      { byUserId: mateo.id,    toUserId: sofia.id,    action: 'LIKE' },
      { byUserId: lucia.id,    toUserId: bruno.id,    action: 'LIKE' },
      { byUserId: isabela.id,  toUserId: rodrigo.id,  action: 'LIKE' },
      // PASS examples
      { byUserId: bruno.id,    toUserId: fernanda.id, action: 'PASS' },
      { byUserId: diego.id,    toUserId: ana.id,      action: 'PASS' },
    ],
  });

  // Session swipes — yoga session 1
  await prisma.swipeEvent.createMany({
    data: [
      { byUserId: ana.id,     toUserId: fernanda.id, sessionId: yogaSession1.id, action: 'LIKE' },
      { byUserId: fernanda.id,toUserId: ana.id,      sessionId: yogaSession1.id, action: 'LIKE' },
      { byUserId: bruno.id,   toUserId: isabela.id,  sessionId: yogaSession1.id, action: 'LIKE' },
      { byUserId: sofia.id,   toUserId: ana.id,      sessionId: yogaSession1.id, action: 'LIKE' },
    ],
  });

  // Session swipes — salsa session 1
  await prisma.swipeEvent.createMany({
    data: [
      { byUserId: fernanda.id, toUserId: diego.id,  sessionId: salsaSession1.id, action: 'LIKE' },
      { byUserId: diego.id,    toUserId: fernanda.id,sessionId: salsaSession1.id, action: 'LIKE' },
      { byUserId: ana.id,      toUserId: lucia.id,   sessionId: salsaSession1.id, action: 'LIKE' },
    ],
  });

  // ── Matches ────────────────────────────────────────────────────────────────
  const mkPair = (a, b) => (a.id < b.id ? [a.id, b.id] : [b.id, a.id]);

  const [uA1, uB1] = mkPair(ana, bruno);
  const [uA2, uB2] = mkPair(fernanda, diego);
  const [uA3, uB3] = mkPair(ana, fernanda);
  const [uA4, uB4] = mkPair(ana, gabriel);
  const [uA5, uB5] = mkPair(camila, rodrigo);
  const [uA6, uB6] = mkPair(sofia, mateo);
  const [uA7, uB7] = mkPair(fernanda, diego);  // session match

  await prisma.match.createMany({
    data: [
      { userAId: uA1, userBId: uB1 },                                            // Ana ↔ Bruno
      { userAId: uA2, userBId: uB2 },                                            // Fernanda ↔ Diego
      { userAId: uA3, userBId: uB3, sessionId: yogaSession1.id },                // Ana ↔ Fernanda (yoga)
      { userAId: uA4, userBId: uB4 },                                            // Ana ↔ Gabriel
      { userAId: uA5, userBId: uB5 },                                            // Camila ↔ Rodrigo
      { userAId: uA6, userBId: uB6 },                                            // Sofía ↔ Mateo
      // Salsa session match (Fernanda↔Diego already exists globally, so different pair)
      { userAId: ana.id < lucia.id ? ana.id : lucia.id,
        userBId: ana.id < lucia.id ? lucia.id : ana.id,
        sessionId: salsaSession1.id },                                            // Ana ↔ Lucía (salsa)
    ],
  });

  // ── Notifications ──────────────────────────────────────────────────────────

  const now = new Date();
  const minsAgo = (m) => new Date(now - m * 60000);
  const hoursAgo = (h) => new Date(now - h * 3600000);
  const daysAgo = (d) => new Date(now - d * 86400000);

  await prisma.notification.createMany({
    data: [
      // ── VALENTINA (lider) — rica variedad ──
      {
        userId: valentina.id, type: 'new_enrollment', isRead: false,
        title: 'Nueva inscripción 🎉',
        body: 'Sofía Bravo se inscribió en Yoga y Meditación y ya pagó.',
        metadata: { enrollmentId: e_sofia_yoga1.id, sessionId: yogaSession1.id },
        createdAt: minsAgo(5),
      },
      {
        userId: valentina.id, type: 'new_enrollment', isRead: false,
        title: 'Nueva inscripción',
        body: 'Camila Mendoza se inscribió en Yoga y Meditación.',
        metadata: { enrollmentId: e_camila_yoga2.id, sessionId: yogaSession2.id },
        createdAt: minsAgo(30),
      },
      {
        userId: valentina.id, type: 'payment_confirmed', isRead: false,
        title: 'Pago recibido 💰',
        body: 'Ana Silva pagó $18.000 por Taller de Improvisación Teatral.',
        metadata: { enrollmentId: e_ana_teatro1.id },
        createdAt: hoursAgo(1),
      },
      {
        userId: valentina.id, type: 'new_enrollment', isRead: false,
        title: 'Nueva inscripción',
        body: 'Fernanda Castro se inscribió en Salsa & Bachata y ya pagó.',
        metadata: { enrollmentId: e_fernanda_salsa1.id, sessionId: salsaSession1.id },
        createdAt: hoursAgo(2),
      },
      {
        userId: valentina.id, type: 'payment_confirmed', isRead: false,
        title: 'Pago recibido 💰',
        body: 'Rodrigo Vargas pagó $25.000 por Trekking Cajón del Maipo.',
        metadata: { enrollmentId: e_rodrigo_trekking1.id },
        createdAt: hoursAgo(3),
      },
      {
        userId: valentina.id, type: 'transfer_completed', isRead: false,
        title: 'Transferencia recibida ✅',
        body: 'Biktus te transfirió $39.000 por pagos de la semana pasada.',
        metadata: { amount: 39000 },
        createdAt: hoursAgo(5),
      },
      {
        userId: valentina.id, type: 'new_enrollment', isRead: true,
        title: 'Nueva inscripción',
        body: 'Bruno Pérez se inscribió en Yoga y Meditación — pago pendiente.',
        metadata: { enrollmentId: e_bruno_yoga1.id, sessionId: yogaSession1.id },
        createdAt: daysAgo(1),
      },
      {
        userId: valentina.id, type: 'new_enrollment', isRead: true,
        title: 'Nueva inscripción',
        body: 'Isabela Ramos se inscribió en Yoga y Meditación — pago pendiente.',
        metadata: { enrollmentId: e_isabela_yoga1.id, sessionId: yogaSession1.id },
        createdAt: daysAgo(1),
      },
      {
        userId: valentina.id, type: 'payment_confirmed', isRead: true,
        title: 'Pago recibido 💰',
        body: 'Fernanda Castro pagó $12.000 por Yoga y Meditación.',
        metadata: { enrollmentId: e_fernanda_yoga1.id },
        createdAt: daysAgo(2),
      },
      {
        userId: valentina.id, type: 'session_reminder', isRead: true,
        title: 'Sesión mañana ⏰',
        body: 'Recordatorio: Yoga y Meditación mañana a las 10:00 AM en Estudio Zen.',
        metadata: { sessionId: yogaSession1.id },
        createdAt: daysAgo(3),
      },
      {
        userId: valentina.id, type: 'new_enrollment', isRead: true,
        title: 'Nueva inscripción',
        body: 'Ana Silva se inscribió en Yoga y Meditación y ya pagó.',
        metadata: { enrollmentId: e_ana_yoga1.id, sessionId: yogaSession1.id },
        createdAt: daysAgo(4),
      },
      {
        userId: valentina.id, type: 'transfer_completed', isRead: true,
        title: 'Transferencia recibida ✅',
        body: 'Biktus te transfirió $24.000 por pagos anteriores.',
        metadata: { amount: 24000 },
        createdAt: daysAgo(7),
      },
      {
        userId: valentina.id, type: 'session_full', isRead: true,
        title: 'Sesión casi completa 🔥',
        body: 'Taller de Improvisación Teatral ya tiene 13 de 15 cupos ocupados.',
        metadata: { sessionId: teatroSession1.id },
        createdAt: daysAgo(5),
      },

      // ── ANA ──
      {
        userId: ana.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Gabriel Torres. ¡Tienen intereses en común!',
        createdAt: hoursAgo(2),
      },
      {
        userId: ana.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Lucía Pizarro en Salsa & Bachata.',
        metadata: { sessionId: salsaSession1.id },
        createdAt: hoursAgo(4),
      },
      {
        userId: ana.id, type: 'session_reminder', isRead: false,
        title: 'Sesión mañana ⏰',
        body: 'Recuerda: Taller de Improvisación Teatral es mañana a las 19:00 en Teatro Mori.',
        metadata: { sessionId: teatroSession1.id },
        createdAt: hoursAgo(6),
      },
      {
        userId: ana.id, type: 'match_created', isRead: true,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Bruno Pérez.',
        createdAt: daysAgo(2),
      },
      {
        userId: ana.id, type: 'match_created', isRead: true,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Fernanda Castro en Yoga y Meditación.',
        metadata: { sessionId: yogaSession1.id },
        createdAt: daysAgo(3),
      },
      {
        userId: ana.id, type: 'payment_confirmed', isRead: true,
        title: 'Pago confirmado ✅',
        body: 'Tu pago de $12.000 por Yoga y Meditación fue confirmado.',
        createdAt: daysAgo(4),
      },

      // ── BRUNO ──
      {
        userId: bruno.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Ana Silva.',
        createdAt: daysAgo(2),
      },
      {
        userId: bruno.id, type: 'payment_received', isRead: false,
        title: 'Recordatorio de pago',
        body: 'Tienes un pago pendiente de $12.000 para Yoga y Meditación. ¡No pierdas tu cupo!',
        metadata: { sessionId: yogaSession1.id },
        createdAt: daysAgo(1),
      },
      {
        userId: bruno.id, type: 'session_reminder', isRead: false,
        title: 'Sesión en 3 días ⏰',
        body: 'Yoga y Meditación es el domingo 20 de abril a las 10:00 AM.',
        metadata: { sessionId: yogaSession1.id },
        createdAt: daysAgo(1),
      },

      // ── FERNANDA ──
      {
        userId: fernanda.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Diego Morales en Salsa & Bachata.',
        metadata: { sessionId: salsaSession1.id },
        createdAt: hoursAgo(3),
      },
      {
        userId: fernanda.id, type: 'payment_confirmed', isRead: false,
        title: 'Pago confirmado ✅',
        body: 'Tu pago de $15.000 por Salsa & Bachata fue confirmado.',
        createdAt: hoursAgo(5),
      },
      {
        userId: fernanda.id, type: 'session_reminder', isRead: false,
        title: 'Sesión mañana 💃',
        body: 'Salsa & Bachata es mañana a las 20:00 en Studio Dance, Las Condes.',
        metadata: { sessionId: salsaSession1.id },
        createdAt: hoursAgo(8),
      },
      {
        userId: fernanda.id, type: 'match_created', isRead: true,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Diego Morales.',
        createdAt: daysAgo(3),
      },

      // ── DIEGO ──
      {
        userId: diego.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Fernanda Castro en Salsa & Bachata.',
        metadata: { sessionId: salsaSession1.id },
        createdAt: hoursAgo(3),
      },
      {
        userId: diego.id, type: 'session_reminder', isRead: false,
        title: 'Sesión este fin de semana ⛰️',
        body: 'Trekking Cajón del Maipo es el sábado 3 de mayo. Sal puntual a las 8:00 AM.',
        metadata: { sessionId: trekkingSession1.id },
        createdAt: daysAgo(1),
      },
      {
        userId: diego.id, type: 'payment_confirmed', isRead: true,
        title: 'Pago confirmado ✅',
        body: 'Tu pago de $25.000 por Trekking Cajón del Maipo fue confirmado.',
        createdAt: daysAgo(2),
      },

      // ── ISABELA ──
      {
        userId: isabela.id, type: 'payment_received', isRead: false,
        title: 'Recordatorio de pago',
        body: 'Tienes un pago pendiente de $12.000 para Yoga y Meditación.',
        metadata: { sessionId: yogaSession1.id },
        createdAt: daysAgo(1),
      },
      {
        userId: isabela.id, type: 'payment_confirmed', isRead: false,
        title: 'Pago confirmado ✅',
        body: 'Tu pago de $10.000 por Ciclismo Grupal fue confirmado.',
        createdAt: hoursAgo(6),
      },
      {
        userId: isabela.id, type: 'session_reminder', isRead: false,
        title: 'Salida de ciclismo 🚴‍♀️',
        body: 'Ciclismo Grupal es el sábado 2 de mayo a las 8:30 AM. ¡Lleva tu bici y mucha energía!',
        metadata: { sessionId: ciclismoSession1.id },
        createdAt: daysAgo(2),
      },

      // ── CAMILA ──
      {
        userId: camila.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Rodrigo Vargas.',
        createdAt: hoursAgo(1),
      },
      {
        userId: camila.id, type: 'session_reminder', isRead: false,
        title: 'Sesión mañana 📸',
        body: 'Fotografía Urbana mañana a las 9:00 AM en Plaza Mulato Gil, Lastarria.',
        metadata: { sessionId: fotografiaSession1.id },
        createdAt: hoursAgo(12),
      },

      // ── RODRIGO ──
      {
        userId: rodrigo.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Camila Mendoza.',
        createdAt: hoursAgo(1),
      },
      {
        userId: rodrigo.id, type: 'payment_confirmed', isRead: true,
        title: 'Pago confirmado ✅',
        body: 'Tu pago de $25.000 por Trekking Cajón del Maipo fue confirmado.',
        createdAt: daysAgo(3),
      },

      // ── GABRIEL ──
      {
        userId: gabriel.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Ana Silva.',
        createdAt: hoursAgo(2),
      },
      {
        userId: gabriel.id, type: 'session_reminder', isRead: false,
        title: 'Sesión mañana 🎭',
        body: 'Taller de Improvisación Teatral es mañana a las 19:00 en Teatro Mori.',
        metadata: { sessionId: teatroSession1.id },
        createdAt: hoursAgo(8),
      },

      // ── LUCÍA ──
      {
        userId: lucia.id, type: 'match_created', isRead: false,
        title: '¡Nuevo match! 💚',
        body: 'Hiciste match con Ana Silva en Salsa & Bachata.',
        metadata: { sessionId: salsaSession1.id },
        createdAt: hoursAgo(4),
      },
      {
        userId: lucia.id, type: 'payment_received', isRead: false,
        title: 'Recordatorio de pago',
        body: 'Tienes un pago pendiente de $12.000 para Yoga y Meditación.',
        metadata: { sessionId: yogaSession2.id },
        createdAt: daysAgo(1),
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
      isVerified: true,
    },
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completo — datos de demo Biktus\n');
  console.log('Usuarios (contraseña: password123):');
  console.log('  lider@biktus.local      → Valentina Reyes   (COMMUNITY_LEADER) — 3 fotos');
  console.log('  ana@biktus.local        → Ana Silva                            — 3 fotos');
  console.log('  bruno@biktus.local      → Bruno Pérez                          — 2 fotos');
  console.log('  diego@biktus.local      → Diego Morales                        — 3 fotos');
  console.log('  fernanda@biktus.local   → Fernanda Castro                      — 3 fotos');
  console.log('  gabriel@biktus.local    → Gabriel Torres                       — 2 fotos');
  console.log('  isabela@biktus.local    → Isabela Ramos                        — 3 fotos');
  console.log('  camila@biktus.local     → Camila Mendoza                       — 2 fotos');
  console.log('  rodrigo@biktus.local    → Rodrigo Vargas                       — 2 fotos');
  console.log('  sofia@biktus.local      → Sofía Bravo                          — 2 fotos');
  console.log('  mateo@biktus.local      → Mateo Núñez                          — 2 fotos');
  console.log('  lucia@biktus.local      → Lucía Pizarro                        — 2 fotos');
  console.log('  admin@biktus.local      → Admin Biktus');
  console.log('\nActividades de Valentina (6):');
  console.log('  Yoga y Meditación        — 3 sesiones');
  console.log('  Teatro Improvisación     — 2 sesiones');
  console.log('  Trekking Cajón del Maipo — 2 sesiones');
  console.log('  Salsa & Bachata          — 2 sesiones (NEW)');
  console.log('  Fotografía Urbana        — 2 sesiones (NEW)');
  console.log('  Ciclismo Grupal          — 2 sesiones (NEW)');
  console.log('\nMatches: Ana↔Bruno, Fernanda↔Diego, Ana↔Fernanda(yoga), Ana↔Gabriel,');
  console.log('         Camila↔Rodrigo, Sofía↔Mateo, Ana↔Lucía(salsa)');
  console.log('\nNotificaciones: ~40 repartidas entre todos los usuarios');
  console.log('Pagos: 14 completados (varios transferidos)\n');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
