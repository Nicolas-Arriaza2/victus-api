import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
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
}
