import { Inject, Injectable } from '@nestjs/common'
import { TCalculationResult } from '@shared'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { Homeless, HostedFiness, Hotel, MakeShiftHousing_RP, MakeShiftHousing_SNE } from '~/generated/prisma/client'
import { ESourceB11 } from '~/schemas/scenarios/scenario'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

@Injectable()
export class NoAccomodationService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async getHostedFiness(epciCode: string): Promise<HostedFiness> {
    return this.prismaService.hostedFiness.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async getHotel(epciCode: string): Promise<Hotel> {
    return this.prismaService.hotel.findFirstOrThrow({
      where: { epciCode, millesime: this.context.millesime },
    })
  }

  async getRPMakeShiftHousing(epciCode: string): Promise<MakeShiftHousing_RP> {
    return this.prismaService.makeShiftHousing_RP.findFirstOrThrow({
      where: { epciCode, millesime: this.context.millesime },
    })
  }

  async getSNEMakeShiftHousing(epciCode: string): Promise<MakeShiftHousing_SNE> {
    return this.prismaService.makeShiftHousing_SNE.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  getHomeless(epciCode: string): Promise<Homeless> {
    return this.prismaService.homeless.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async calculate(simulation: TSimulationWithEpciAndScenario): Promise<TCalculationResult> {
    const { baseYear } = this.context
    const { epcis, scenario } = simulation
    const { projection, b1_horizon_resorption: horizon } = scenario

    const results = await Promise.all(
      epcis.map(async (epci) => {
        const value = await this.calculateByEpci(simulation, epci.code)
        const prorataValue = horizon > projection ? Math.round((value * (projection - baseYear)) / (horizon - baseYear)) : Math.round(value)
        return {
          epciCode: epci.code,
          value,
          prorataValue,
        }
      }),
    )
    const total = results.reduce((sum, result) => sum + result.value, 0)
    const prorataTotal = results.reduce((sum, result) => sum + result.prorataValue, 0)
    return {
      epcis: results,
      total,
      prorataTotal,
    }
  }

  async calculateByEpci(simulation: TSimulationWithEpciAndScenario, epciCode: string): Promise<number> {
    const { scenario } = simulation

    const { b11_fortune, b11_hotel, b11_sa, source_b11 } = scenario
    const homeless = await this.getHomeless(epciCode)
    const hotel = await this.getHotel(epciCode)

    const sourceMap = {
      [ESourceB11.RP]: {
        habitat_fortune: (await this.getRPMakeShiftHousing(epciCode)).value,
        hotel: hotel.rp,
        sans_abri: homeless.rp,
      },
      [ESourceB11.SNE]: {
        habitat_fortune: (await this.getSNEMakeShiftHousing(epciCode)).camping + (await this.getSNEMakeShiftHousing(epciCode)).squat,
        hotel: hotel.sne,
        sans_abri: homeless.sne,
      },
    }
    const selectedSource = sourceMap[source_b11]
    const result = [
      (b11_sa && selectedSource.sans_abri) || 0,
      (b11_fortune && selectedSource.habitat_fortune) || 0,
      (b11_hotel && selectedSource.hotel) || 0,
    ].reduce((sum, value) => sum + value, 0)

    try {
      const hostedFiness = await this.getHostedFiness(epciCode)
      const establishmentResult = scenario.b11_etablissement.reduce((sum, etab) => sum + hostedFiness[etab], 0)

      const totalResult = result + Math.round(establishmentResult * (scenario.b11_part_etablissement / 100.0))
      return this.applyCoefficient(totalResult)
    } catch {
      return this.applyCoefficient(result)
    }
  }
}
