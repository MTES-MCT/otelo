import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { ExternalService } from '~/external/external.service'
import { TAmfCreateSimulationBody, TAmfCreateSimulationResponse, TAmfEpci, TAmfShareContactsBody } from './amf.schemas'
import { buildAmfResult, roundToTen } from './amf-result'
import { AMF_HORIZON, buildAmfSimulationBody } from './amf-scenario'

type Scenario = 'haute' | 'central' | 'basse'

@Injectable()
export class AmfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataPackVersions: DataPackVersionsService,
    private readonly demographicEvolution: DemographicEvolutionService,
    private readonly externalService: ExternalService,
    private readonly accommodationRates: AccommodationRatesService,
  ) {}

  async getEpci(epciCode: string): Promise<TAmfEpci> {
    const { millesime } = await this.dataPackVersions.getActive()
    return this.loadEpci(epciCode, millesime)
  }

  private async loadEpci(epciCode: string, millesime: string): Promise<TAmfEpci> {
    const epci = await this.prisma.epci.findUnique({
      where: { code: epciCode },
      select: { code: true, name: true, noInseeProjection: true },
    })
    if (!epci) throw new NotFoundException(`EPCI ${epciCode} introuvable`)

    const baseYear = Number(millesime)
    const projections = await this.demographicEvolution.getDemographicEvolutionPopulationByEpci(epciCode, millesime, [
      baseYear,
      AMF_HORIZON,
    ])
    const data = projections[epciCode]?.data ?? []
    const base = data.find((row) => row.year === baseYear)
    const horizon = data.find((row) => row.year === AMF_HORIZON)

    const change = (scenario: Scenario): number | null => {
      const from = base?.[scenario]
      const to = horizon?.[scenario]
      if (from == null || to == null) return null
      return roundToTen(to - from)
    }

    const haute = change('haute')
    const central = change('central')
    if (haute === null || central === null) throw new NotFoundException(`Projections de population indisponibles pour l'EPCI ${epciCode}`)

    return {
      code: epci.code,
      name: epci.name,
      fragileProjection: epci.noInseeProjection,
      baseYear,
      horizon: AMF_HORIZON,
      populationChanges: { haute, central, basse: change('basse') },
    }
  }

  async createSimulation(consumerId: string, body: TAmfCreateSimulationBody): Promise<TAmfCreateSimulationResponse> {
    const { email, ...answers } = body
    const { millesime } = await this.dataPackVersions.getActive()
    const epci = await this.loadEpci(answers.epciCode, millesime)
    if (answers.demography === 'moins' && epci.populationChanges.basse === null) {
      throw new BadRequestException(`Projection basse indisponible pour l'EPCI ${answers.epciCode}`)
    }

    const ratesByEpci = await this.accommodationRates.getAccommodationRates(answers.epciCode, millesime)
    const observed = ratesByEpci[answers.epciCode]
    if (!observed) throw new NotFoundException(`Taux observés indisponibles pour l'EPCI ${answers.epciCode}`)

    const simulationBody = buildAmfSimulationBody(
      answers,
      {
        longTermVacancyRate: observed.longTermVacancyRate,
        shortTermVacancyRate: observed.shortTermVacancyRate,
        txRs: observed.txRs,
        restructuringRate: observed.restructuringRate,
        disappearanceRate: observed.disappearanceRate,
      },
      millesime,
      epci.name,
    )
    const { id: simulationId, results } = await this.externalService.createSimulation(consumerId, simulationBody)

    const lead = await this.prisma.amfLead.create({
      data: { email, epciCode: answers.epciCode, simulationId, answers },
      select: { id: true },
    })

    return { leadId: lead.id, result: buildAmfResult(results, answers.epciCode, epci.baseYear) }
  }

  async addContacts(leadId: string, body: TAmfShareContactsBody): Promise<void> {
    const lead = await this.prisma.amfLead.findUnique({ where: { id: leadId }, select: { id: true } })
    if (!lead) throw new NotFoundException(`Lead ${leadId} introuvable`)
    await this.prisma.amfSharedContact.createMany({
      data: body.contacts.map((contact) => ({ leadId, role: contact.role, email: contact.email })),
    })
  }
}
