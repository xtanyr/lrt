import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PasswordResetMessage {
  email: string;
  resetUrl: string;
}

@Injectable()
export class PasswordResetDeliveryService {
  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('PASSWORD_RESET_EMAIL_API_KEY') &&
      this.configService.get<string>('PASSWORD_RESET_FROM_EMAIL'),
    );
  }

  async sendPasswordReset(message: PasswordResetMessage): Promise<void> {
    const apiKey = this.configService.get<string>('PASSWORD_RESET_EMAIL_API_KEY');
    const from = this.configService.get<string>('PASSWORD_RESET_FROM_EMAIL');
    const endpoint = this.configService.get<string>('PASSWORD_RESET_EMAIL_API_URL') ||
      'https://api.resend.com/emails';

    if (!apiKey || !from) {
      throw new ServiceUnavailableException('Password reset email delivery is not configured');
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [message.email],
          subject: 'Сброс пароля',
          text: `Чтобы задать новый пароль, откройте ссылку: ${message.resetUrl}`,
        }),
      });
    } catch {
      throw new ServiceUnavailableException('Could not send password reset email');
    }

    if (!response.ok) {
      throw new ServiceUnavailableException('Could not send password reset email');
    }
  }
}
