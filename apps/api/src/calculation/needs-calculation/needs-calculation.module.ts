import { Module, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { Request } from 'express'
import { AccommodationRatesModule } from '~/accommodation-rates/accommodation-rates.module'
import { CoefficientCalculationModule } from '~/calculation/coefficient-calculation/coefficient-calculation.module'
import { CoefficientCalculationService } from '~/calculation/coefficient-calculation/coefficient-calculation.service'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { FlowRequirementService } from '~/calculation/needs-calculation/besoins-flux/flow-requirement.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { RatioCalculationModule } from '~/calculation/ratio-calculation/ratio-calculation.module'
import { PrismaModule } from '~/db/prisma.module'
import { DemographicEvolutionCustomService } from '~/demographic-evolution-custom/demographic-evolution-custom.service'
import { SimulationsModule } from '~/simulations/simulations.module'
import { SimulationsService } from '~/simulations/simulations.service'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { VacancyModule } from '~/vacancy/vacancy.module'

interface AuthenticatedRequest extends Request {
  user: {
    id: string
  }
}

@Module({
  exports: [NeedsCalculationService],
  imports: [PrismaModule, CoefficientCalculationModule, RatioCalculationModule, SimulationsModule, VacancyModule, AccommodationRatesModule],
  providers: [
    {
      inject: [CoefficientCalculationService, SimulationsService, REQUEST],
      provide: 'CalculationContext',
      scope: Scope.REQUEST,
      useFactory: async (
        coefficientCalculationService: CoefficientCalculationService,
        simulationService: SimulationsService,
        request: AuthenticatedRequest,
      ) => {
        const simulationId = request.params.simulationId as string | undefined
        if (!simulationId) {
          return {
            baseYear: 2021,
            coefficient: 1,
          }
        }
        const simulation = await simulationService.get(simulationId as string)
        const coefficient = await coefficientCalculationService.calculateCoefficient(
          simulation.scenario.b1_horizon_resorption,
          simulation.scenario.projection,
        )

        return {
          coefficient,
          baseYear: 2021,
        }
      },
    },
    NeedsCalculationService,
    NoAccomodationService,
    HostedService,
    FinancialInadequationService,
    BadQualityService,
    PhysicalInadequationService,
    DemographicEvolutionService,
    DemographicEvolutionCustomService,
    RenewalHousingStockService,
    SitadelService,
    FlowRequirementService,
    StockRequirementsService,
  ],
})
export class NeedsCalculationModule {}
