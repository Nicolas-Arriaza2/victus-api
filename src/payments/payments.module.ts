import { forwardRef, Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { MercadoPagoService } from './mercadopago.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [AuthModule, forwardRef(() => SubscriptionsModule)],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, MercadoPagoService],
  exports: [MercadoPagoService],
})
export class PaymentsModule {}
