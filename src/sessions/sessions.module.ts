import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { PaymentRemindersTask } from './payment-reminders.task';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService, PaymentRemindersTask],
})
export class SessionsModule {}
