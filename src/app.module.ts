import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InterestsModule } from './interests/interests.module';
import { ActivitiesModule } from './activities/activities.module';
import { SessionsModule } from './sessions/sessions.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SwipesModule } from './swipes/swipes.module';
import { MatchesModule } from './matches/matches.module';
import { FirebaseModule } from './firebase/firebase.module';
import { PhotosModule } from './photos/photos.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    FirebaseModule,
    AuthModule,
    PhotosModule,
    UsersModule,
    InterestsModule,
    ActivitiesModule,
    SessionsModule,
    EnrollmentsModule,
    SwipesModule,
    MatchesModule,
    NotificationsModule,
    PaymentsModule,
    SubscriptionsModule,
    AdminModule,
  ],
})
export class AppModule {}
