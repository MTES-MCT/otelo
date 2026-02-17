import { Module } from '@nestjs/common'
import { AccommodationRatesModule } from '~/accommodation-rates/accommodation-rates.module'
import { CoefficientCalculationModule } from '~/calculation/coefficient-calculation/coefficient-calculation.module'
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
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { VacancyModule } from '~/vacancy/vacancy.module'

export const CLI_CALCULATION_CONTEXT = { coefficient: 1, baseYear: 2021 }

@Module({
  exports: [NeedsCalculationService, 'CalculationContext'],
  imports: [PrismaModule, CoefficientCalculationModule, RatioCalculationModule, VacancyModule, AccommodationRatesModule],
  providers: [
    {
      provide: 'CalculationContext',
      useValue: CLI_CALCULATION_CONTEXT,
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
export class NeedsCalculationCliModule {}
