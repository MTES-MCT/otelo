import { Injectable, NotFoundException } from '@nestjs/common'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { TAmfEpci } from './amf.schemas'
import { roundToTen } from './amf-result'
import { AMF_HORIZON } from './amf-scenario'

type Scenario = 'haute' | 'central' | 'basse'

@Injectable()
export class AmfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataPackVersions: DataPackVersionsService,
    private readonly demographicEvolution: DemographicEvolutionService,
  ) {}

  async getEpci(epciCode: string): Promise<TAmfEpci> {
    const epci = await this.prisma.epci.findUnique({
      where: { code: epciCode },
      select: { code: true, name: true, noInseeProjection: true },
    })
    if (!epci) throw new NotFoundException(`EPCI ${epciCode} introuvable`)

    const { millesime } = await this.dataPackVersions.getActive()
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
}
