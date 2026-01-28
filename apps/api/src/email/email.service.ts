import { HttpService } from '@nestjs/axios'
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { TEmailDto } from '~/schemas/email/email'
import { TUser } from '~/schemas/users/user'
import { IEmailService } from './interfaces/email-service.interface'

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly apiUrl: string
  private readonly apiKey: string
  private readonly defaultSender: { name: string; email: string }

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('BREVO_API_KEY')
    this.apiUrl = this.configService.getOrThrow<string>('BREVO_API_URL')
    const senderName = this.configService.getOrThrow<string>('EMAIL_SENDER_NAME')
    const senderEmail = this.configService.getOrThrow<string>('EMAIL_SENDER_EMAIL')

    // Set default sender
    this.defaultSender = {
      name: senderName,
      email: senderEmail,
    }
  }

  /**
   * Sends an email using Brevo API
   * @param options Email options
   */
  async sendEmail(options: TEmailDto): Promise<void> {
    try {
      this.logger.log(`Sending email to ${options.to}`)

      const payload = {
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        sender: {
          name: options.senderName || this.defaultSender.name,
          email: options.from || this.defaultSender.email,
        },
        to: [{ email: options.to }],
        attachment: options.attachments,
      }

      const headers = {
        accept: 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      }

      await firstValueFrom(this.httpService.post(this.apiUrl, payload, { headers }))

      this.logger.log(`Email sent successfully to ${options.to}`)
    } catch (error) {
      this.logger.error(`Failed to send email:`, { error })
      throw new InternalServerErrorException('Failed to send email')
    }
  }

  /**
   * Sends an email using a template
   * @param template The template ID in Brevo
   * @param data The data to populate the template with
   * @param to The recipient email address
   * @param subject The email subject
   */
  async sendTemplatedEmail(template: string, data: Record<string, string>, to: string, subject: string): Promise<void> {
    try {
      this.logger.log(`Sending templated email to ${to} using template ${template}`)

      const payload = {
        templateId: parseInt(template, 10),
        params: data,
        subject: subject,
        to: [{ email: to }],
        sender: this.defaultSender,
      }

      const headers = {
        accept: 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      }

      await firstValueFrom(this.httpService.post(this.apiUrl, payload, { headers }))

      this.logger.log(`Templated email sent successfully to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send email:`, { error })
      throw new InternalServerErrorException('Failed to send templated email')
    }
  }

  async sendEmailVerificationEmail(user: TUser, confirmationUri: string): Promise<void> {
    const templateId = this.configService.getOrThrow<string>('BREVO_EMAIL_VERIFICATION_TEMPLATE_ID')

    await this.sendTemplatedEmail(
      templateId,
      {
        firstname: user.firstname,
        confirmationUrl: confirmationUri,
      },
      user.email,
      'Vérification de votre inscription sur Otelo',
    )
  }
}
