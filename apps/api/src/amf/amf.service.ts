import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { ExternalService } from '~/external/external.service'
import { TAmfAnswers, TAmfCreateSimulationBody, TAmfCreateSimulationResponse, TAmfEpci, TAmfShareContactsBody } from './amf.schemas'
import { amfVariantContributions, buildAmfResult, roundToTen, TAnnualContributions } from './amf-result'
import { AMF_HORIZON, buildAmfScenarioVariant, buildAmfSimulationBody, TAmfVariant, TObservedRates, withAmfVariant } from './amf-scenario'

type Scenario = 'haute' | 'central' | 'basse'

export type TAmfEstimate = {
  simulationId: string
  baseYear: number
  contributions: Record<TAmfVariant, TAnnualContributions>
}

@Injectable()
export class AmfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataPackVersions: DataPackVersionsService,
    private readonly demographicEvolution: DemographicEvolutionService,
    private readonly externalService: ExternalService,
    private readonly accommodationRates: AccommodationRatesService,
    private readonly needsCalculation: NeedsCalculationService,
  ) {}

  async getEpci(epciCode: string): Promise<TAmfEpci> {
    const { millesime } = await this.dataPackVersions.getActive()
    const { epci } = await this.loadEpci(epciCode, millesime)
    return epci
  }

  private async loadEpci(epciCode: string, millesime: string): Promise<{ epci: TAmfEpci; rates: TObservedRates }> {
    const epci = await this.prisma.epci.findUnique({
      where: { code: epciCode },
      select: { code: true, name: true, noInseeProjection: true },
    })
    if (!epci) throw new NotFoundException(`EPCI ${epciCode} introuvable`)

    const baseYear = Number(millesime)
    const [projections, censuses, ratesByEpci] = await Promise.all([
      this.demographicEvolution.getDemographicEvolutionPopulationByEpci(epciCode, millesime, [baseYear, AMF_HORIZON]),
      this.prisma.rP.findMany({ where: { epciCode, millesime }, select: { year: true, population: true }, orderBy: { year: 'asc' } }),
      this.accommodationRates.getAccommodationRates(epciCode, millesime),
    ])

    const horizon = (projections[epciCode]?.data ?? []).find((row) => row.year === AMF_HORIZON)
    const projected = (scenario: Scenario): number | null => {
      const value = horizon?.[scenario]
      return value == null ? null : roundToTen(value)
    }
    const haute = projected('haute')
    const central = projected('central')
    if (haute === null || central === null) throw new NotFoundException(`Projections de population indisponibles pour l'EPCI ${epciCode}`)

    const observed = ratesByEpci[epciCode]
    if (!observed) throw new NotFoundException(`Taux observés indisponibles pour l'EPCI ${epciCode}`)

    const latest = censuses[censuses.length - 1]
    const previous = censuses[censuses.length - 2]

    return {
      epci: {
        code: epci.code,
        name: epci.name,
        fragileProjection: epci.noInseeProjection,
        baseYear,
        horizon: AMF_HORIZON,
        population: latest ? Math.round(latest.population) : null,
        recentEvolution:
          latest && previous && previous.population > 0
            ? { fromYear: previous.year, toYear: latest.year, rate: latest.population / previous.population - 1 }
            : null,
        projectedPopulation: { haute, central, basse: projected('basse') },
        secondaryResidencesShare: observed.txRs,
        longTermVacancy: observed.vacancy.year === undefined ? null : { count: observed.longTermVacantCount, year: observed.vacancy.year },
      },
      rates: {
        longTermVacancyRate: observed.longTermVacancyRate,
        shortTermVacancyRate: observed.shortTermVacancyRate,
        txRs: observed.txRs,
      },
    }
  }

  /**
   * Calcule les deux variantes d'un jeu de réponses : la basse est enregistrée comme simulation de l'API externe,
   * la haute se calcule en mémoire sur une copie. Les contributions sont renvoyées avant arrondi.
   */
  async estimate(consumerId: string, answers: TAmfAnswers): Promise<TAmfEstimate> {
    const { millesime } = await this.dataPackVersions.getActive()
    const { epci, rates } = await this.loadEpci(answers.epciCode, millesime)
    if (answers.demography === 'moins' && epci.projectedPopulation.basse === null) {
      throw new BadRequestException(`Projection basse indisponible pour l'EPCI ${answers.epciCode}`)
    }

    const { results: lowResults, ...simulation } = await this.externalService.createSimulation(
      consumerId,
      buildAmfSimulationBody(answers, rates, millesime, epci.name),
    )
    const highResults = await this.needsCalculation.calculate(
      withAmfVariant(simulation, answers.epciCode, buildAmfScenarioVariant(answers, rates, 'high')),
    )

    return {
      simulationId: simulation.id,
      baseYear: epci.baseYear,
      contributions: amfVariantContributions({ low: lowResults, high: highResults }, answers, epci.baseYear),
    }
  }

  async createSimulation(consumerId: string, body: TAmfCreateSimulationBody): Promise<TAmfCreateSimulationResponse> {
    const { email, ...answers } = body
    const { simulationId, baseYear, contributions } = await this.estimate(consumerId, answers)

    const lead = await this.prisma.amfLead.create({
      data: { email, epciCode: answers.epciCode, simulationId, answers },
      select: { id: true },
    })

    return { leadId: lead.id, result: buildAmfResult(contributions, baseYear) }
  }

  async addContacts(leadId: string, body: TAmfShareContactsBody): Promise<void> {
    const lead = await this.prisma.amfLead.findUnique({ where: { id: leadId }, select: { id: true } })
    if (!lead) throw new NotFoundException(`Lead ${leadId} introuvable`)
    await this.prisma.amfSharedContact.createMany({
      data: body.contacts.map((contact) => ({ leadId, role: contact.role, email: contact.email })),
    })
  }
}
