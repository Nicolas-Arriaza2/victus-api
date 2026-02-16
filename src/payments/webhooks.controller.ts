import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mercadopago')
  handleMercadoPago(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}
