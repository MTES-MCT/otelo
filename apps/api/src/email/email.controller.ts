import { Body, Controller, Logger, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Throttle } from '@nestjs/throttler'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import escapeHtml from 'escape-html'
import { ContactDto } from '~/email/email.dto'
import { EmailService } from '~/email/email.service'

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name)
  private readonly receiverEmail: string

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.receiverEmail = this.configService.getOrThrow<string>('EMAIL_RECEIVER_EMAIL')
  }

  @Post('contact')
  @AllowAnonymous()
  @Throttle({ default: { ttl: 900_000, limit: 3 } })
  async contact(@Body() body: ContactDto) {
    const firstname = escapeHtml(body.firstname)
    const lastname = escapeHtml(body.lastname)
    const email = escapeHtml(body.email)
    const subject = escapeHtml(body.subject)
    const message = escapeHtml(body.message)

    const htmlContent = `
            <h1>Formulaire de Contact</h1>
            <p><strong>Prénom :</strong> ${firstname}</p>
            <p><strong>Nom :</strong> ${lastname}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Objet :</strong> ${subject}</p>
            <p><strong>Message :</strong> ${message}</p>
        `
    try {
      await this.emailService.sendEmail({
        to: this.receiverEmail,
        subject: `Formulaire de contact : ${body.subject}`,
        html: htmlContent,
        text: `Formulaire de Contact\n\nPrénom : ${body.firstname}\nNom : ${body.lastname}\nEmail : ${body.email}\nObjet : ${body.subject}\nMessage : ${body.message}`,
      })

      return { success: true, message: 'Email envoyé avec succès' }
    } catch (err) {
      this.logger.error(err)
      return { success: false, message: "Une erreur est survenue lors de l'envoi de l'email." }
    }
  }
}
