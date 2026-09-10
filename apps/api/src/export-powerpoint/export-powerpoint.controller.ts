import { Body, ConflictException, Controller, ForbiddenException, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Throttle } from '@nestjs/throttler'
import dayjs from 'dayjs'
import escapeHtml from 'escape-html'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { EmailService } from '~/email/email.service'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { CheckPowerpointRequestDto, RequestPowerpointDto } from '~/export-powerpoint/export-powerpoint.dto'
import { ExportPowerpointService } from '~/export-powerpoint/export-powerpoint.service'
import {
  PowerpointRequestsService,
  TPowerpointDuplicateReason,
  TReplaceablePowerpointRequest,
} from '~/export-powerpoint/powerpoint-requests.service'
import { Role } from '~/generated/prisma/enums'
import { TEmailDto } from '~/schemas/email/email'
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
    private readonly powerpointRequestsService: PowerpointRequestsService,
    private readonly emailService: EmailService,
  ) {
    this.receiverEmail = this.configService.getOrThrow<string>('EMAIL_RECEIVER_EMAIL')
  }

  /**
   * Indique si la demande en cours viendrait doubler une demande récente sur le
   * même territoire, pour que le formulaire puisse demander confirmation.
   *
   * Cette vérification est un appel distinct et non un contrôle dans `POST /` :
   * le mail à l'équipe n'y part qu'après la génération du PowerPoint et d'un
   * classeur Excel par scénario. Confirmer à ce moment-là reviendrait à produire
   * jusqu'à quatre fichiers pour éventuellement les jeter.
   */
  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkDuplicate(@User() user: TUser, @Body() { selectedSimulations, epciCodes }: CheckPowerpointRequestDto) {
    const hasAccess = await this.simulationsService.hasUserAccessToAll(selectedSimulations, user.id)
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to one or more selected simulations')
    }

    const previousRequest = await this.powerpointRequestsService.findReplaceable(user.id, selectedSimulations, epciCodes)

    return {
      windowMinutes: this.powerpointRequestsService.windowMinutes,
      previousRequest,
    }
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  async requestPowerpoint(@User() user: TUser, @Body() data: RequestPowerpointDto) {
    const { nextStep, resultDate, selectedSimulations, privilegedSimulation, epcis, epci, documentType, periodStart, periodEnd } = data

    const hasAccess = await this.simulationsService.hasUserAccessToAll(selectedSimulations, user.id)
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to one or more selected simulations')
    }

    // La confirmation ne peut pas être contournée en appelant l'API directement,
    // ni par un onglet resté ouvert dont la vérification a vieilli : on rejoue le
    // contrôle ici et on exige que l'utilisateur ait confirmé *cette* demande-là.
    const requestedEpciCodes = !!epcis && epcis.length > 0 ? epcis.map((item) => item.code) : epci ? [epci.code] : []

    const replaceable = await this.powerpointRequestsService.findReplaceable(user.id, selectedSimulations, requestedEpciCodes)
    if (replaceable && data.replacesRequestId !== replaceable.requestId) {
      throw new ConflictException({
        message: 'Une demande récente existe déjà sur ce territoire et doit être explicitement remplacée.',
        windowMinutes: this.powerpointRequestsService.windowMinutes,
        previousRequest: replaceable,
      })
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

    // `privilegedSimulation` est obligatoire dans le formulaire mais n'était pas transmis :
    // tous les exports PowerPoint étaient enregistrés avec `isPrivileged: false`.
    const requestId = await this.powerpointRequestsService.record(selectedSimulations, {
      documentType,
      epciCodes: requestedEpciCodes,
      nextStep,
      periodEnd: Number.parseInt(periodEnd, 10) || undefined,
      periodStart: Number.parseInt(periodStart, 10) || undefined,
      privilegedSimulationId: privilegedSimulation,
    })
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
      ${replaceable ? this.replacementNoticeHtml(replaceable) : ''}
      <h1>Demande de PowerPoint</h1>
      <p><strong>Email de l'utilisateur:</strong> ${escapeHtml(user.email)}</p>
      <p><strong>Type de document:</strong> ${escapeHtml(documentType)}</p>
      <p><strong>Année de début et fin de document:</strong> ${escapeHtml(periodStart)} - ${escapeHtml(periodEnd)}</p>
      <p><strong>Prochaine étape:</strong> ${escapeHtml(nextStep)}</p>
      <p><strong>Date du résultat:</strong> ${new Date(resultDate).toLocaleDateString('fr-FR')}</p>
      ${privilegedSim ? `<p><strong>Scénario privilégié:</strong> ${escapeHtml(privilegedSim.name)}</p>` : ''}
      <p><strong>Simulations sélectionnées:</strong></p>
      <ul>
        ${simulations.map((sim) => `<li>${escapeHtml(sim.name)}</li>`).join('')}
      </ul>
      <p><strong>EPCI(s) demandé(s):</strong></p>
      ${
        !!epcis && epcis.length > 0
          ? `<ul>
        ${epcis.map((epciItem) => `<li>${escapeHtml(epciItem.name)} - ${escapeHtml(epciItem.code)}</li>`).join('')}
      </ul>`
          : epci
            ? `<ul><li>${escapeHtml(epci.name)} - ${escapeHtml(epci.code)}</li></ul>`
            : ''
      }
    `

    try {
      await this.emailService.sendEmail({
        to: this.receiverEmail,
        subject: replaceable ? 'Demande de PowerPoint remplaçant une demande précédente' : 'Nouvelle demande de PowerPoint',
        html: htmlContent,
        text: `${replaceable ? `${this.replacementNoticeText(replaceable)}\n\n` : ''}Demande de PowerPoint\n\nEmail de l'utilisateur: ${user.email}\nType de document: ${documentType}\nPériode d'étude: ${periodStart} - ${periodEnd}\nProchaine étape: ${nextStep}\nDate du résultat: ${new Date(resultDate).toLocaleDateString('fr-FR')}${privilegedSim ? `\nScénario privilégié: ${privilegedSim.name}` : ''}\nSimulations sélectionnées:\n${simulations.map((sim) => `- ${sim.name}`).join('\n')}\nEPCI(s) demandé(s):\n${!!epcis && epcis.length > 0 ? epcis.map((epciItem) => `- ${epciItem.name} - ${epciItem.code}`).join('\n') : epci ? `- ${epci.name} - ${epci.code}` : ''}`,
        attachments,
      })

      // Après l'envoi seulement : si le mail échoue, la demande précédente reste
      // la référence, plutôt que de laisser l'équipe sans aucune demande active.
      if (replaceable) {
        await this.powerpointRequestsService.supersede(replaceable.requestId, requestId)
      }

      return { success: true, message: 'Email sent successfully' }
    } catch (err) {
      this.logger.error(err)
      return { success: false, message: 'An error occurred while sending email.' }
    }
  }

  /** Ce qui a fait considérer la demande précédente comme un doublon. */
  private reasonLabel(reason: TPowerpointDuplicateReason): string {
    switch (reason) {
      case 'RECENT':
        return `demande faite il y a moins de ${this.powerpointRequestsService.windowMinutes} minutes`
      case 'SAME_DAY':
        return 'demande faite plus tôt dans la même journée'
      case 'SAME_SCENARIOS_AND_TERRITORY':
        return 'mêmes scénarios et même territoire'
    }
  }

  private replacedSummary(previous: TReplaceablePowerpointRequest): string {
    return [
      `Demande remplacée : ${previous.documentType ?? 'type non renseigné'}`,
      `période ${previous.periodStart ?? '?'} - ${previous.periodEnd ?? '?'}`,
      `prochaine étape « ${previous.nextStep ?? 'non renseignée'} »`,
      `territoire : ${previous.epciNames.join(', ') || 'non renseigné'}`,
      `scénarios : ${previous.simulationNames.join(', ') || 'aucun'}`,
    ].join(', ')
  }

  private replacementNoticeHtml(previous: TReplaceablePowerpointRequest): string {
    return `
      <div style="border-left: 4px solid #b34000; padding: 8px 16px; margin-bottom: 16px; background: #fff4f0;">
        <p style="margin: 0 0 8px;"><strong>⚠️ Cette demande remplace une demande précédente.</strong></p>
        <p style="margin: 0;">
          L'utilisateur a confirmé vouloir remplacer sa demande du
          <strong>${dayjs(previous.requestedAt).format('DD/MM/YYYY à HH:mm')}</strong>.
          La demande précédente est à ignorer.
        </p>
        <p style="margin: 8px 0 0;">
          Doublon détecté sur : ${previous.reasons.map((reason) => this.reasonLabel(reason)).join(' ; ')}.
        </p>
        <p style="margin: 8px 0 0;">${escapeHtml(this.replacedSummary(previous))}.</p>
      </div>
    `
  }

  private replacementNoticeText(previous: TReplaceablePowerpointRequest): string {
    return [
      '/!\\ Cette demande remplace une demande précédente.',
      `L'utilisateur a confirmé vouloir remplacer sa demande du ${dayjs(previous.requestedAt).format('DD/MM/YYYY à HH:mm')}. La demande précédente est à ignorer.`,
      `Doublon détecté sur : ${previous.reasons.map((reason) => this.reasonLabel(reason)).join(' ; ')}.`,
      `${this.replacedSummary(previous)}.`,
    ].join('\n')
  }
}
