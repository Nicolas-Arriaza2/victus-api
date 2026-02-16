import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MercadoPagoConfig,
  Preference,
  Payment as MpPayment,
} from 'mercadopago';

@Injectable()
export class MercadoPagoService implements OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);
  private preferenceClient: Preference;
  private paymentClient: MpPayment;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const accessToken = this.config.get<string>('mercadopago_access_token');
    if (!accessToken) {
      this.logger.warn('mercadopago_access_token not configured');
      return;
    }

    const mpConfig = new MercadoPagoConfig({ accessToken });
    this.preferenceClient = new Preference(mpConfig);
    this.paymentClient = new MpPayment(mpConfig);
    this.logger.log('MercadoPago SDK initialized');
  }

  async createPreference(
    items: { id: string; title: string; quantity: number; unit_price: number }[],
    externalReference: string,
    notificationUrl: string,
    backUrls: { success: string; failure: string; pending: string },
  ) {
    return this.preferenceClient.create({
      body: {
        items: items.map((item) => ({
          ...item,
          currency_id: 'CLP',
        })),
        external_reference: externalReference,
        notification_url: notificationUrl,
        back_urls: backUrls,
        auto_return: 'approved',
      },
    });
  }

  async getPayment(mpPaymentId: string) {
    return this.paymentClient.get({ id: mpPaymentId });
  }
}
