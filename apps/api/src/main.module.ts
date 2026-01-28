import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { BassinModule } from '~/bassin/bassin.module'
import { AuthenticationGuard } from '~/common/guards/authentication.guard'
import { AuthorizationGuard } from '~/common/guards/authorization.guard'
import envRessources from '~/config/environment'
import { CronModule } from '~/cron/cron.module'
import { ExportExcelModule } from '~/export-excel/export-excel.module'
import { ResultsModule } from '~/results/results.module'
import { AccommodationRatesModule } from './accommodation-rates/accommodation-rates.module'
import { AdminModule } from './admin/admin.module'
import { AuthModule } from './auth/auth.module'
import { BadQualityModule } from './bad-quality/bad-quality.module'
import { CalculationModule } from './calculation/calculation.module'
import { EmailVerificationModule } from './common/exceptions/email-verification/email-verification.module'
import { DataVisualisationModule } from './data-visualisation/data-visualisation.module'
import { DemographicEvolutionModule } from './demographic-evolution/demographic-evolution.module'
import { DemographicEvolutionCustomModule } from './demographic-evolution-custom/demographic-evolution-custom.module'
import { EmailModule } from './email/email.module'
import { EpciGroupsModule } from './epci-groups/epci-groups.module'
import { EpcisModule } from './epcis/epcis.module'
import { ExportPowerpointModule } from './export-powerpoint/export-powerpoint.module'
import { FilocomModule } from './filocom/filocom.module'
import { FinancialInadequationModule } from './financial-inadequation/financial-inadequation.module'
import { HealthController } from './health/health.controller'
import { HostedModule } from './hosted/hosted.module'
import { HouseholdSizesModule } from './household-sizes/household-sizes.module'
import { NoAccommodationModule } from './no-accommodation/no-accommodation.module'
import { PhysicalInadequationModule } from './physical-inadequation/physical-inadequation.module'
import { RpInseeModule } from './rp-insee/rp-insee.module'
import { ScenariosModule } from './scenarios/scenarios.module'
import { SessionsModule } from './sessions/sessions.module'
import { SimulationsModule } from './simulations/simulations.module'
import { SitadelModule } from './sitadel/sitadel.module'
import { StatisticsModule } from './statistics/statistics.module'
import { UsersModule } from './users/users.module'
import { VacancyModule } from './vacancy/vacancy.module'

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envRessources],
    }),
    ScenariosModule,
    SessionsModule,
    UsersModule,
    AuthModule,
    EpcisModule,
    EpciGroupsModule,
    SimulationsModule,
    CalculationModule,
    ResultsModule,
    DemographicEvolutionModule,
    DemographicEvolutionCustomModule,
    AccommodationRatesModule,
    VacancyModule,
    BassinModule,
    DataVisualisationModule,
    RpInseeModule,
    FilocomModule,
    BadQualityModule,
    HostedModule,
    NoAccommodationModule,
    FinancialInadequationModule,
    PhysicalInadequationModule,
    EmailModule,
    CronModule,
    AdminModule,
    StatisticsModule,
    EmailVerificationModule,
    ExportExcelModule,
    ExportPowerpointModule,
    SitadelModule,
    HouseholdSizesModule,
  ],
  providers: [
    AuthenticationGuard,
    AuthorizationGuard,
    {
      provide: APP_GUARD,
      useExisting: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: AuthorizationGuard,
    },
  ],
})
export class MainModule {}
