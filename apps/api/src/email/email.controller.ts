import { Body, Controller, Logger, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Public } from '~/common/decorators/public.decorator'
import { EmailService } from '~/email/email.service'
import { TContactDto } from '~/schemas/email/email'

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
  @Public()
  async contact(@Body() body: TContactDto) {
    const htmlContent = `
            <h1>Formulaire de Contact</h1>
            <p><strong>Prénom :</strong> ${body.firstname}</p>
            <p><strong>Nom :</strong> ${body.lastname}</p>
            <p><strong>Email :</strong> ${body.email}</p>
            <p><strong>Objet :</strong> ${body.subject}</p>
            <p><strong>Message :</strong> ${body.message}</p>
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
