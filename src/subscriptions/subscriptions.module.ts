import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsBillingService } from './subscriptions-billing.service';
import { SubscriptionsController } from './subscriptions.controller';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [AuthModule, forwardRef(() => PaymentsModule)],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsBillingService],
  exports: [SubscriptionsService, SubscriptionsBillingService],
})
export class SubscriptionsModule {}
