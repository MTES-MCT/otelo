import { Body, Controller, ForbiddenException, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { EmailService } from '~/email/email.service'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { ExportPowerpointService } from '~/export-powerpoint/export-powerpoint.service'
import { Role } from '~/generated/prisma/enums'
import { TEmailDto } from '~/schemas/email/email'
import { TRequestPowerpoint } from '~/schemas/export-powerpoint/export-powerpoint'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'

@Controller('export-powerpoint')
export class ExportPowerpointController {
  private readonly logger = new Logger(ExportPowerpointController.name)
  private readonly receiverEmail: string

  constructor(
    private configService: ConfigService,
    private readonly exportPowerpointService: ExportPowerpointService,
    private readonly exportExcelService: ExportExcelService,
    private readonly simulationsService: SimulationsService,
    private readonly emailService: EmailService,
  ) {
    this.receiverEmail = this.configService.getOrThrow<string>('EMAIL_RECEIVER_EMAIL')
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async requestPowerpoint(@User() user: TUser, @Body() data: TRequestPowerpoint) {
    const { nextStep, resultDate, selectedSimulations, privilegedSimulation, epcis, epci, documentType, periodStart, periodEnd } = data

    const hasAccess = await this.simulationsService.hasUserAccessToAll(selectedSimulations, user.id)
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to one or more selected simulations')
    }

    const selectedEpci = !!epcis && epcis.length > 0 ? epcis[0] : epci

    if (!selectedEpci) {
      throw new Error('Either epci or epcis must be provided')
    }

    const powerpointBuffer = await this.exportPowerpointService.generateFromTemplate({
      ...data,
      epci: selectedEpci,
      username: `${user.firstname}  ${user.lastname}`,
    })

    await this.simulationsService.markAsExported(selectedSimulations)
    const simulations = await this.simulationsService.getMany(selectedSimulations)

    const privilegedSim = data.privilegedSimulation ? simulations.find((sim) => sim.id === privilegedSimulation) : null

    const attachments: TEmailDto['attachments'] = []

    attachments.push({
      name: `Template Powerpoint.pptx`,
      content: powerpointBuffer.toString('base64'),
    })

    for (const simulation of simulations) {
      const { workbook } = await this.exportExcelService.exportScenario(simulation.id)
      const excelBuffer = await workbook.xlsx.writeBuffer()

      const name = `Export parametres_${simulation.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`

      attachments.push({
        name,
        content: Buffer.from(excelBuffer).toString('base64'),
      })
    }

    const htmlContent = `
      <h1>Demande de PowerPoint</h1>
      <p><strong>Email de l'utilisateur:</strong> ${user.email}</p>
      <p><strong>Type de document:</strong> ${documentType}</p>
      <p><strong>Année de début et fin de document:</strong> ${periodStart} - ${periodEnd}</p> 
      <p><strong>Prochaine étape:</strong> ${nextStep}</p>
      <p><strong>Date du résultat:</strong> ${new Date(resultDate).toLocaleDateString('fr-FR')}</p>
      ${privilegedSim ? `<p><strong>Scénario privilégié:</strong> ${privilegedSim.name}</p>` : ''}
      <p><strong>Simulations sélectionnées:</strong></p>
      <ul>
        ${simulations.map((sim) => `<li>${sim.name}</li>`).join('')}
      </ul>
      <p><strong>EPCI(s) demandé(s):</strong></p>
      ${
        !!epcis && epcis.length > 0
          ? `<ul>
        ${epcis.map((epciItem) => `<li>${epciItem.name} - ${epciItem.code}</li>`).join('')}
      </ul>`
          : epci
            ? `<ul><li>${epci.name} - ${epci.code}</li></ul>`
            : ''
      }
    `

    try {
      await this.emailService.sendEmail({
        to: this.receiverEmail,
        subject: 'Nouvelle demande de PowerPoint',
        html: htmlContent,
        text: `Demande de PowerPoint\n\nEmail de l'utilisateur: ${user.email}\nType de document: ${documentType}\nPériode d'étude: ${periodStart} - ${periodEnd}\nProchaine étape: ${nextStep}\nDate du résultat: ${new Date(resultDate).toLocaleDateString('fr-FR')}${privilegedSim ? `\nScénario privilégié: ${privilegedSim.name}` : ''}\nSimulations sélectionnées:\n${simulations.map((sim) => `- ${sim.name}`).join('\n')}\nEPCI(s) demandé(s):\n${!!epcis && epcis.length > 0 ? epcis.map((epciItem) => `- ${epciItem.name} - ${epciItem.code}`).join('\n') : epci ? `- ${epci.name} - ${epci.code}` : ''}`,
        attachments,
      })

      return { success: true, message: 'Email sent successfully' }
    } catch (err) {
      this.logger.error(err)
      return { success: false, message: 'An error occurred while sending email.' }
    }
  }
}
