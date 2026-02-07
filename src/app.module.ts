import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InterestsModule } from './interests/interests.module';
import { ActivitiesModule } from './activities/activities.module';
import { SessionsModule } from './sessions/sessions.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SwipesModule } from './swipes/swipes.module';
import { MatchesModule } from './matches/matches.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    InterestsModule,
    ActivitiesModule,
    SessionsModule,
    EnrollmentsModule,
    SwipesModule,
    MatchesModule,
  ],
})
export class AppModule {}
