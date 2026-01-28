import { TEmailDto } from '~/schemas/email/email'

export interface IEmailService {
  /**
   * Sends an email using the configured email provider
   * @param options Email options including recipient, subject, and content
   * @returns A promise that resolves when the email is sent
   */
  sendEmail(options: TEmailDto): Promise<void>

  /**
   * Sends an email using a template
   * @param template The template name or ID
   * @param data The data to populate the template with
   * @param to The recipient email address
   * @param subject The email subject
   * @returns A promise that resolves when the email is sent
   */
  sendTemplatedEmail(template: string, data: Record<string, string>, to: string, subject: string): Promise<void>
}
