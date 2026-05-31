import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendSms(mobile: string, message: string): Promise<boolean> {
    const apiKey = this.config.get('SMS_API_KEY');
    const senderId = this.config.get('SMS_SENDER_ID');

    if (!apiKey || !senderId) {
      this.logger.warn('SMS gateway not configured — SMS_API_KEY or SMS_SENDER_ID missing');
      return false;
    }

    try {
      this.logger.log(`[SMS] to ${mobile}: ${message.substring(0, 50)}`);
      // TODO: wire actual MSG91 API call here
      // POST https://api.msg91.com/api/v5/flow/ with authkey=apiKey
      return true;
    } catch (err) {
      this.logger.error(`SMS send failed: ${err}`);
      return false;
    }
  }
}
