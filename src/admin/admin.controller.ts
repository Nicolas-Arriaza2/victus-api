import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

const DEMO_USERS: Array<{
  email: string;
  photos: string[];
}> = [
  {
    email: 'lider@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/10.jpg',
      'https://randomuser.me/api/portraits/women/11.jpg',
      'https://randomuser.me/api/portraits/women/12.jpg',
    ],
  },
  {
    email: 'ana@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/20.jpg',
      'https://randomuser.me/api/portraits/women/21.jpg',
      'https://randomuser.me/api/portraits/women/22.jpg',
    ],
  },
  {
    email: 'bruno@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/20.jpg',
      'https://randomuser.me/api/portraits/men/21.jpg',
    ],
  },
  {
    email: 'diego@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/30.jpg',
      'https://randomuser.me/api/portraits/men/31.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
    ],
  },
  {
    email: 'fernanda@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/30.jpg',
      'https://randomuser.me/api/portraits/women/31.jpg',
      'https://randomuser.me/api/portraits/women/32.jpg',
    ],
  },
  {
    email: 'gabriel@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/40.jpg',
      'https://randomuser.me/api/portraits/men/41.jpg',
    ],
  },
  {
    email: 'isabela@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/40.jpg',
      'https://randomuser.me/api/portraits/women/41.jpg',
      'https://randomuser.me/api/portraits/women/42.jpg',
    ],
  },
  {
    email: 'camila@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/50.jpg',
      'https://randomuser.me/api/portraits/women/51.jpg',
    ],
  },
  {
    email: 'rodrigo@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/50.jpg',
      'https://randomuser.me/api/portraits/men/51.jpg',
    ],
  },
  {
    email: 'sofia@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/60.jpg',
      'https://randomuser.me/api/portraits/women/61.jpg',
    ],
  },
  {
    email: 'mateo@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/60.jpg',
      'https://randomuser.me/api/portraits/men/61.jpg',
    ],
  },
  {
    email: 'lucia@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/70.jpg',
      'https://randomuser.me/api/portraits/women/71.jpg',
    ],
  },
];

@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Post('seed-photos')
  async seedPhotos(@Headers('x-admin-secret') secret: string) {
    if (secret !== 'biktus-demo-2026') {
      throw new UnauthorizedException('Invalid secret');
    }

    const results: Record<string, string> = {};

    for (const { email, photos } of DEMO_USERS) {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        results[email] = 'not found — skipped';
        continue;
      }

      // Remove existing demo photos
      await this.prisma.userPhoto.deleteMany({ where: { userId: user.id } });

      // Insert new photos
      for (let i = 0; i < photos.length; i++) {
        await this.prisma.userPhoto.create({
          data: {
            userId: user.id,
            url: photos[i],
            position: i,
            format: 'jpg',
          },
        });
      }

      // Set avatarUrl to first photo
      await this.prisma.userProfile.update({
        where: { userId: user.id },
        data: { avatarUrl: photos[0] },
      });

      results[email] = `${photos.length} photos added`;
    }

    return { ok: true, results };
  }

  @Post('seed-stats')
  async seedStats(@Headers('x-admin-secret') secret: string) {
    if (secret !== 'biktus-demo-2026') throw new UnauthorizedException('Invalid secret');

    const lider = await this.prisma.user.findUnique({ where: { email: 'lider@biktus.local' } });
    if (!lider) return { ok: false, error: 'Leader not found' };

    const activities = await this.prisma.activity.findMany({
      where: { createdById: lider.id },
      include: { sessions: { select: { id: true } } },
    });
    if (!activities.length) return { ok: false, error: 'No activities found' };

    const users = await this.prisma.user.findMany({
      where: {
        email: { in: ['ana@biktus.local','bruno@biktus.local','diego@biktus.local',
                       'fernanda@biktus.local','gabriel@biktus.local','isabela@biktus.local'] },
      },
      select: { id: true, email: true },
    });
    const byEmail = Object.fromEntries(users.map((u) => [u.email, u.id]));

    let enrollmentsAdded = 0;
    let paymentsAdded    = 0;
    let payCounter       = 1000;

    for (const activity of activities) {
      for (const session of activity.sessions) {
        for (const uid of Object.values(byEmail)) {
          // skip if already enrolled
          const exists = await this.prisma.activityEnrollment.findUnique({
            where: { sessionId_userId: { sessionId: session.id, userId: uid as string } },
          });
          if (exists) continue;

          const enrollment = await this.prisma.activityEnrollment.create({
            data: {
              sessionId: session.id,
              userId: uid as string,
              status: 'confirmed',
              paymentStatus: 'paid',
            },
          });
          enrollmentsAdded++;

          const amount = [10000, 12000, 15000, 18000, 20000, 25000][payCounter % 6];
          payCounter++;
          const mpId = `demo-stats-pay-${payCounter}`;

          const existing = await this.prisma.payment.findUnique({ where: { mpPaymentId: mpId } });
          if (!existing) {
            const transferred = payCounter % 3 !== 0;
            await this.prisma.payment.create({
              data: {
                userId: uid as string,
                activityId: activity.id,
                enrollmentId: enrollment.id,
                leaderId: lider.id,
                totalAmount: amount,
                platformFee: 0,
                leaderAmount: amount,
                mpPaymentId: mpId,
                mpStatus: 'approved',
                status: 'completed',
                transferStatus: transferred ? 'transferred' : 'pending',
                paidAt: new Date(Date.now() - Math.random() * 30 * 86400000),
                ...(transferred ? { transferredAt: new Date(Date.now() - Math.random() * 15 * 86400000) } : {}),
              },
            });
            paymentsAdded++;
          }
        }
      }
    }

    return { ok: true, enrollmentsAdded, paymentsAdded };
  }

  @Post('migrate-forum')
  async migrateForum(@Headers('x-admin-secret') secret: string) {
    if (secret !== 'biktus-demo-2026') {
      throw new UnauthorizedException('Invalid secret');
    }

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ForumQuestion" (
        "id" TEXT NOT NULL,
        "activityId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ForumQuestion_pkey" PRIMARY KEY ("id")
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ForumAnswer" (
        "id" TEXT NOT NULL,
        "questionId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ForumAnswer_pkey" PRIMARY KEY ("id")
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ForumQuestion_activityId_idx" ON "ForumQuestion"("activityId")
    `);
    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ForumAnswer_questionId_idx" ON "ForumAnswer"("questionId")
    `);

    // Foreign keys (ignore errors if already exist)
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "ForumQuestion"
          ADD CONSTRAINT "ForumQuestion_activityId_fkey"
          FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch {}
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "ForumQuestion"
          ADD CONSTRAINT "ForumQuestion_authorId_fkey"
          FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch {}
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "ForumAnswer"
          ADD CONSTRAINT "ForumAnswer_questionId_fkey"
          FOREIGN KEY ("questionId") REFERENCES "ForumQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch {}
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "ForumAnswer"
          ADD CONSTRAINT "ForumAnswer_authorId_fkey"
          FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch {}

    // Mark migration as applied in Prisma's migration table
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","logs","rolled_back_at","started_at","applied_steps_count")
        VALUES (gen_random_uuid(),'manual',NOW(),'20260422000000_add_forum',NULL,NULL,NOW(),1)
        ON CONFLICT DO NOTHING
      `);
    } catch {}

    return { ok: true, message: 'Forum tables created' };
  }

  @Post('seed-social')
  async seedSocial(@Headers('x-admin-secret') secret: string) {
    if (secret !== 'biktus-demo-2026') throw new UnauthorizedException('Invalid secret');

    const lider = await this.prisma.user.findUnique({ where: { email: 'lider@biktus.local' } });
    if (!lider) return { ok: false, error: 'Leader not found' };

    const activities = await this.prisma.activity.findMany({
      where: { createdById: lider.id },
      include: { sessions: { select: { id: true } } },
    });

    const yogaAct     = activities.find((a) => a.title.includes('Yoga'));
    const teatroAct   = activities.find((a) => a.title.includes('Teatro') || a.title.includes('Impro'));
    const trekkingAct = activities.find((a) => a.title.includes('Trekking'));

    const yogaSessionId     = yogaAct?.sessions[0]?.id     ?? null;
    const teatroSessionId   = teatroAct?.sessions[0]?.id   ?? null;
    const trekkingSessionId = trekkingAct?.sessions[0]?.id ?? null;

    // Prospect users: create them if they don't exist (non-enrolled, no sessions)
    const prospectDefs = [
      { email: 'camila@biktus.local',  firstName: 'Camila',  lastName: 'Vega',    gender: 'female' as const },
      { email: 'rodrigo@biktus.local', firstName: 'Rodrigo', lastName: 'Peña',    gender: 'male'   as const },
      { email: 'sofia@biktus.local',   firstName: 'Sofía',   lastName: 'Morales', gender: 'female' as const },
    ];
    const passwordHash = await argon2.hash('password123');
    for (const p of prospectDefs) {
      const exists = await this.prisma.user.findUnique({ where: { email: p.email } });
      if (!exists) {
        await this.prisma.user.create({
          data: {
            email: p.email,
            passwordHash,
            profile: { create: { firstName: p.firstName, lastName: p.lastName, gender: p.gender } },
          },
        });
      }
    }

    const users = await this.prisma.user.findMany({
      where: {
        email: {
          in: ['ana@biktus.local', 'diego@biktus.local', 'bruno@biktus.local',
               'fernanda@biktus.local', 'camila@biktus.local', 'rodrigo@biktus.local',
               'sofia@biktus.local'],
        },
      },
      select: { id: true, email: true },
    });
    const byEmail = Object.fromEntries(users.map((u) => [u.email, u.id]));

    // Remove previous swipes toward leader to keep data clean
    await this.prisma.swipeEvent.deleteMany({ where: { toUserId: lider.id } });

    const swipeDefs: Array<{ email: string; sessionId: string | null }> = [
      // Enrolled users — swipe with session context (contributes to activity compatibility)
      { email: 'ana@biktus.local',      sessionId: yogaSessionId },
      { email: 'diego@biktus.local',    sessionId: yogaSessionId },
      { email: 'bruno@biktus.local',    sessionId: teatroSessionId },
      { email: 'fernanda@biktus.local', sessionId: trekkingSessionId },
      // Non-enrolled prospects — no session (likesFromProspects)
      { email: 'camila@biktus.local',   sessionId: null },
      { email: 'rodrigo@biktus.local',  sessionId: null },
      { email: 'sofia@biktus.local',    sessionId: null },
    ];

    let created = 0;
    for (const { email, sessionId } of swipeDefs) {
      const byUserId = byEmail[email];
      if (!byUserId) continue;
      await this.prisma.swipeEvent.create({
        data: {
          byUserId,
          toUserId: lider.id,
          action: 'LIKE',
          ...(sessionId ? { sessionId } : {}),
        },
      });
      created++;
    }

    return { ok: true, swipesCreated: created, breakdown: {
      likesFromParticipants: 4,
      likesFromProspects: 3,
      compatibilityByActivity: {
        yoga: yogaSessionId ? 2 : 0,
        teatro: teatroSessionId ? 1 : 0,
        trekking: trekkingSessionId ? 1 : 0,
      },
    }};
  }

  @Post('seed-forum')
  async seedForum(@Headers('x-admin-secret') secret: string) {
    if (secret !== 'biktus-demo-2026') {
      throw new UnauthorizedException('Invalid secret');
    }

    // Get activities
    const activities = await this.prisma.activity.findMany({
      select: { id: true, title: true },
    });
    if (!activities.length) return { ok: false, error: 'No activities found' };

    // Get users
    const users = await this.prisma.user.findMany({
      where: { email: { in: ['ana@biktus.local', 'bruno@biktus.local', 'diego@biktus.local', 'fernanda@biktus.local', 'gabriel@biktus.local', 'isabela@biktus.local', 'lider@biktus.local'] } },
      select: { id: true, email: true },
    });
    const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));

    const lider    = byEmail['lider@biktus.local'];
    const ana      = byEmail['ana@biktus.local'];
    const bruno    = byEmail['bruno@biktus.local'];
    const diego    = byEmail['diego@biktus.local'];
    const fernanda = byEmail['fernanda@biktus.local'];
    const gabriel  = byEmail['gabriel@biktus.local'];
    const isabela  = byEmail['isabela@biktus.local'];

    if (!lider) return { ok: false, error: 'Leader user not found' };

    // Clear existing forum data
    await this.prisma.forumAnswer.deleteMany();
    await this.prisma.forumQuestion.deleteMany();

    let total = 0;

    for (const activity of activities) {
      const questions: Array<{ authorId: string; body: string; answers: Array<{ authorId: string; body: string }> }> = [];

      if (activity.title.includes('Yoga')) {
        questions.push(
          { authorId: ana?.id ?? lider.id, body: '¿Necesito experiencia previa para unirme? Es mi primera vez con el yoga.',
            answers: [
              { authorId: lider.id, body: '¡Para nada! Las clases están diseñadas para todos los niveles. Comenzamos siempre con los fundamentos.' },
              { authorId: fernanda?.id ?? lider.id, body: 'Yo tampoco tenía experiencia y me encantó desde el primer día. No te preocupes.' },
            ],
          },
          { authorId: bruno?.id ?? lider.id, body: '¿Qué debo llevar a la clase? ¿Mat incluido?',
            answers: [
              { authorId: lider.id, body: 'El estudio tiene mats disponibles, pero si tienes el tuyo es mejor. También trae ropa cómoda y agua.' },
            ],
          },
          { authorId: isabela?.id ?? lider.id, body: '¿Se puede recuperar una clase si falté?',
            answers: [
              { authorId: lider.id, body: 'Sí, puedes recuperar dentro del mismo mes. Solo avísame con anticipación para coordinar el espacio.' },
            ],
          },
        );
      } else if (activity.title.includes('Teatro') || activity.title.includes('Impro')) {
        questions.push(
          { authorId: gabriel?.id ?? lider.id, body: '¿Este taller sirve también para vencer el miedo escénico? Soy muy tímido.',
            answers: [
              { authorId: lider.id, body: '¡Absolutamente! Trabajar la improvisación es una de las mejores formas de ganar confianza en escena y en la vida cotidiana.' },
              { authorId: ana?.id ?? lider.id, body: 'Vine exactamente por eso y fue transformador. Valentina crea un ambiente muy seguro y sin juicios.' },
            ],
          },
          { authorId: diego?.id ?? lider.id, body: '¿El taller termina con alguna presentación o muestra?',
            answers: [
              { authorId: lider.id, body: 'Sí, al finalizar hacemos una muestra informal para familiares y amigos. Es opcional pero muy divertida.' },
            ],
          },
        );
      } else if (activity.title.includes('Trekking')) {
        questions.push(
          { authorId: diego?.id ?? lider.id, body: '¿Qué nivel de condición física se necesita para la ruta?',
            answers: [
              { authorId: lider.id, body: 'Nivel intermedio. La ruta tiene unos 12 km con 400m de desnivel. Si puedes caminar 1 hora sin problemas, estás listo.' },
              { authorId: isabela?.id ?? lider.id, body: 'Yo la hice el año pasado y con entrenamiento moderado está perfecto. Vale la pena cada paso.' },
            ],
          },
          { authorId: ana?.id ?? lider.id, body: '¿El precio incluye transporte desde Santiago?',
            answers: [
              { authorId: lider.id, body: 'Sí, el transporte de ida y vuelta está incluido. Partimos a las 7:30 AM desde metro Baquedano.' },
            ],
          },
        );
      } else if (activity.title.includes('Salsa') || activity.title.includes('Bachata')) {
        questions.push(
          { authorId: fernanda?.id ?? lider.id, body: '¿Necesito ir con pareja o se puede ir solo?',
            answers: [
              { authorId: lider.id, body: '¡Solo! Rotamos parejas durante la clase para que todos aprendan con distintas personas. Es parte de la magia.' },
              { authorId: ana?.id ?? lider.id, body: 'Vine sola la primera vez y terminé conociendo a gente increíble. Totalmente recomendado.' },
            ],
          },
          { authorId: bruno?.id ?? lider.id, body: '¿Cuánto tiempo lleva aprender los pasos básicos?',
            answers: [
              { authorId: lider.id, body: 'En 2-3 clases ya manejas la base para bailar en una salsa. Lo importante es disfrutar el proceso.' },
            ],
          },
        );
      } else if (activity.title.includes('Fotografía')) {
        questions.push(
          { authorId: ana?.id ?? lider.id, body: '¿Con qué cámara debo ir? ¿Sirve el celular?',
            answers: [
              { authorId: lider.id, body: '¡Totalmente! Los mejores fotógrafos urbanos del mundo usan iPhone. Lo importante es la mirada, no el equipo.' },
              { authorId: diego?.id ?? lider.id, body: 'Yo voy con mi Sony mirrorless pero vi fotos increíbles hechas con celular. No te limites.' },
            ],
          },
          { authorId: gabriel?.id ?? lider.id, body: '¿Se aprende edición en la actividad?',
            answers: [
              { authorId: lider.id, body: 'Hacemos una intro a Lightroom Mobile al final de la salida. Es básico pero suficiente para empezar.' },
            ],
          },
        );
      } else if (activity.title.includes('Ciclismo')) {
        questions.push(
          { authorId: isabela?.id ?? lider.id, body: '¿Qué pasa si no tengo bicicleta?',
            answers: [
              { authorId: lider.id, body: 'Puedes arrendar en el Bike Santiago que está a 200m del punto de encuentro. Cuesta aprox $5.000 la media mañana.' },
            ],
          },
          { authorId: bruno?.id ?? lider.id, body: '¿Cuántos kilómetros es la ruta aproximadamente?',
            answers: [
              { authorId: lider.id, body: 'Unos 25 km en total por ciclovías y parques. Ritmo tranquilo con paradas para fotos y un café a mitad de camino.' },
              { authorId: isabela?.id ?? lider.id, body: 'La última vez pasamos por el Parque Forestal y el Mapocho. Un paseo increíble.' },
            ],
          },
        );
      } else {
        // Generic questions for any other activity
        questions.push(
          { authorId: ana?.id ?? lider.id, body: '¿Cómo me inscribo en esta actividad?',
            answers: [
              { authorId: lider.id, body: 'Desde la app directamente. Elige la sesión que te acomode y confirma el pago. ¡Nos vemos allá!' },
            ],
          },
        );
      }

      for (const q of questions) {
        const question = await this.prisma.forumQuestion.create({
          data: {
            activityId: activity.id,
            authorId: q.authorId,
            body: q.body,
          },
        });
        for (const a of q.answers) {
          await this.prisma.forumAnswer.create({
            data: {
              questionId: question.id,
              authorId: a.authorId,
              body: a.body,
            },
          });
        }
        total++;
      }
    }

    return { ok: true, questionsCreated: total };
  }

  @Post('seed-cross')
  async seedCross(@Headers('x-admin-secret') secret: string) {
    if (secret !== 'biktus-demo-2026') throw new UnauthorizedException('Invalid secret');

    const hash = await argon2.hash('password123');
    const log: string[] = [];

    // ── 1. Set lider@biktus.local interests ───────────────────────────────
    const lider = await this.prisma.user.findUnique({ where: { email: 'lider@biktus.local' } });
    if (!lider) return { ok: false, error: 'Leader not found' };

    const LIDER_INTEREST_SLUGS = ['yoga', 'meditacion', 'senderismo', 'trekking', 'fotografia'];
    const liderInterests = await this.prisma.interest.findMany({
      where: { slug: { in: LIDER_INTEREST_SLUGS } },
    });
    await this.prisma.userInterest.deleteMany({ where: { userId: lider.id } });
    await this.prisma.userInterest.createMany({
      data: liderInterests.map((i) => ({ userId: lider.id, interestId: i.id })),
      skipDuplicates: true,
    });
    log.push(`lider interests set: ${liderInterests.map((i) => i.slug).join(', ')}`);

    // ── 2. Create second leader: Carlos ───────────────────────────────────
    let carlos = await this.prisma.user.findUnique({ where: { email: 'carlos@biktus.local' } });
    if (!carlos) {
      carlos = await this.prisma.user.create({
        data: {
          email: 'carlos@biktus.local',
          passwordHash: hash,
          roles: ['COMMUNITY_LEADER'],
          profile: { create: { firstName: 'Carlos', lastName: 'Mendoza', gender: 'male' } },
        },
      });
      log.push('carlos@biktus.local created');
    } else {
      log.push('carlos@biktus.local already exists');
    }

    // Set Carlos interests: salsa, teatro, comedia, musica
    const CARLOS_INTEREST_SLUGS = ['salsa', 'teatro', 'comedia', 'musica'];
    const carlosInterests = await this.prisma.interest.findMany({
      where: { slug: { in: CARLOS_INTEREST_SLUGS } },
    });
    await this.prisma.userInterest.deleteMany({ where: { userId: carlos.id } });
    await this.prisma.userInterest.createMany({
      data: carlosInterests.map((i) => ({ userId: carlos.id, interestId: i.id })),
      skipDuplicates: true,
    });

    // Carlos photo
    const carlosPhoto = await this.prisma.userPhoto.findFirst({ where: { userId: carlos.id } });
    if (!carlosPhoto) {
      await this.prisma.userPhoto.create({
        data: { userId: carlos.id, url: 'https://randomuser.me/api/portraits/men/35.jpg', position: 0, format: 'jpg' },
      });
      await this.prisma.userProfile.update({
        where: { userId: carlos.id },
        data: { avatarUrl: 'https://randomuser.me/api/portraits/men/35.jpg' },
      });
    }

    // ── 3. Activity A: NO compatibility (salsa, bachata, reggaeton) ─────────
    const now = new Date();
    let actSalsa = await this.prisma.activity.findFirst({
      where: { createdById: carlos.id, title: { contains: 'Salsa' } },
    });
    if (!actSalsa) {
      const salsaInterests = await this.prisma.interest.findMany({
        where: { slug: { in: ['salsa', 'bachata', 'reggaeton'] } },
      });
      actSalsa = await this.prisma.activity.create({
        data: {
          slug: `salsa-bachata-${Date.now()}`,
          title: 'Taller de Salsa y Bachata',
          type: 'dance',
          description: 'Aprende a bailar salsa y bachata desde cero. Clases dinámicas en pareja, rotamos para que todos practiquen.',
          createdById: carlos.id,
          interests: { create: salsaInterests.map((i) => ({ interestId: i.id })) },
          sessions: {
            create: [
              {
                startsAt: new Date(now.getTime() + 5 * 86_400_000),
                endsAt:   new Date(now.getTime() + 5 * 86_400_000 + 7_200_000),
                capacity: 20,
                priceCents: 12000,
                locationName: 'Centro de Danza Vivace, Providencia',
              },
              {
                startsAt: new Date(now.getTime() + 12 * 86_400_000),
                endsAt:   new Date(now.getTime() + 12 * 86_400_000 + 7_200_000),
                capacity: 20,
                priceCents: 12000,
                locationName: 'Centro de Danza Vivace, Providencia',
              },
            ],
          },
        },
      });
      log.push('activity Salsa created');
    }

    // ── 4. Activity B: HIGH compatibility (fotografia, arte, viajes-grupales) ─
    let actFoto = await this.prisma.activity.findFirst({
      where: { createdById: carlos.id, title: { contains: 'Fotografía' } },
    });
    if (!actFoto) {
      const fotoInterests = await this.prisma.interest.findMany({
        where: { slug: { in: ['fotografia', 'arte', 'viajes-grupales'] } },
      });
      actFoto = await this.prisma.activity.create({
        data: {
          slug: `fotografia-urbana-${Date.now()}`,
          title: 'Fotografía Urbana Weekend',
          type: 'art',
          description: 'Salida fotográfica por el centro histórico. Aprende composición, luz natural y edición básica con Lightroom Mobile.',
          createdById: carlos.id,
          interests: { create: fotoInterests.map((i) => ({ interestId: i.id })) },
          sessions: {
            create: [
              {
                startsAt: new Date(now.getTime() + 8 * 86_400_000),
                endsAt:   new Date(now.getTime() + 8 * 86_400_000 + 14_400_000),
                capacity: 12,
                priceCents: 15000,
                locationName: 'Plaza de Armas, Santiago',
              },
            ],
          },
        },
      });
      log.push('activity Fotografía Urbana created');
    }

    // ── 5. Enroll lider in the Fotografía session (already inscrito demo) ────
    const fotoSession = await this.prisma.activitySession.findFirst({
      where: { activityId: actFoto.id },
      orderBy: { startsAt: 'asc' },
    });
    if (fotoSession) {
      await this.prisma.activityEnrollment.upsert({
        where: { sessionId_userId: { sessionId: fotoSession.id, userId: lider.id } },
        update: {},
        create: { sessionId: fotoSession.id, userId: lider.id, status: 'confirmed', paymentStatus: 'paid' },
      });
      log.push('lider enrolled in Fotografía session');
    }

    // ── 6. Create a session TOMORROW in lider's yoga activity, with pending payments ─
    const yoga = await this.prisma.activity.findFirst({
      where: { createdById: lider.id, title: { contains: 'Yoga' } },
    });
    if (yoga) {
      // tomorrow at 10 AM
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
      const tomorrowEnd = new Date(tomorrow.getTime() + 5_400_000); // +90 min

      let paySession = await this.prisma.activitySession.findFirst({
        where: { activityId: yoga.id, startsAt: { gte: tomorrow, lt: new Date(tomorrow.getTime() + 86_400_000) } },
      });
      if (!paySession) {
        paySession = await this.prisma.activitySession.create({
          data: {
            activityId: yoga.id,
            startsAt: tomorrow,
            endsAt: tomorrowEnd,
            capacity: 15,
            priceCents: 8000,
            locationName: 'Estudio Yoga Sol, Las Condes',
          },
        });
        log.push('session tomorrow (yoga) created');
      }

      // Enroll 3 users with pending_payment
      const pendingUsers = await this.prisma.user.findMany({
        where: { email: { in: ['ana@biktus.local', 'diego@biktus.local', 'gabriel@biktus.local'] } },
        select: { id: true, email: true },
      });
      for (const u of pendingUsers) {
        await this.prisma.activityEnrollment.upsert({
          where: { sessionId_userId: { sessionId: paySession.id, userId: u.id } },
          update: { paymentStatus: 'pending_payment', status: 'confirmed' },
          create: { sessionId: paySession.id, userId: u.id, status: 'confirmed', paymentStatus: 'pending_payment' },
        });
      }
      log.push(`${pendingUsers.length} enrollments with pending_payment for tomorrow session`);
    }

    return { ok: true, log };
  }

  @Post('reset-demo-pass')
  async resetDemoPass(@Headers('x-admin-secret') secret: string) {
    if (secret !== 'biktus-demo-2026') throw new UnauthorizedException();
    const hash = await argon2.hash('BiktusReview2026');
    await this.prisma.user.update({
      where: { email: 'lider@biktus.local' },
      data: { passwordHash: hash },
    });
    return { ok: true, email: 'lider@biktus.local' };
  }
}
