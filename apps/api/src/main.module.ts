import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth'
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'
import { auth } from '~/auth/better-auth'
import { BassinModule } from '~/bassin/bassin.module'
import { AuthorizationGuard } from '~/common/guards/authorization.guard'
import envRessources from '~/config/environment'
import { CronModule } from '~/cron/cron.module'
import { PrismaModule } from '~/db/prisma.module'
import { ExportExcelModule } from '~/export-excel/export-excel.module'
import { ResultsModule } from '~/results/results.module'
import { AccommodationRatesModule } from './accommodation-rates/accommodation-rates.module'
import { AdminModule } from './admin/admin.module'
import { AuthModule } from './auth/auth.module'
import { BadQualityModule } from './bad-quality/bad-quality.module'
import { CalculationModule } from './calculation/calculation.module'
import { ConsumersModule } from './consumers/consumers.module'
import { DataPackVersionsModule } from './data-pack-versions/data-pack-versions.module'
import { DataVisualisationModule } from './data-visualisation/data-visualisation.module'
import { DemographicEvolutionModule } from './demographic-evolution/demographic-evolution.module'
import { DemographicEvolutionCustomModule } from './demographic-evolution-custom/demographic-evolution-custom.module'
import { EmailModule } from './email/email.module'
import { EpciGroupsModule } from './epci-groups/epci-groups.module'
import { EpciNeighborsModule } from './epci-neighbors/epci-neighbors.module'
import { EpcisModule } from './epcis/epcis.module'
import { ExportPowerpointModule } from './export-powerpoint/export-powerpoint.module'
import { ExternalModule } from './external/external.module'
import { FeedbackModule } from './feedback/feedback.module'
import { FilocomModule } from './filocom/filocom.module'
import { FinancialInadequationModule } from './financial-inadequation/financial-inadequation.module'
import { HealthController } from './health/health.controller'
import { HostedModule } from './hosted/hosted.module'
import { HouseholdSizesModule } from './household-sizes/household-sizes.module'
import { NoAccommodationModule } from './no-accommodation/no-accommodation.module'
import { PhysicalInadequationModule } from './physical-inadequation/physical-inadequation.module'
import { RpInseeModule } from './rp-insee/rp-insee.module'
import { ScenariosModule } from './scenarios/scenarios.module'
import { ShareLinksModule } from './share-links/share-links.module'
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
    // Better Auth module - provides global AuthGuard with @AllowAnonymous() and @OptionalAuth() decorators
    BetterAuthModule.forRoot({ auth }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 100 }] }),
    PrismaModule,
    ScenariosModule,
    UsersModule,
    AuthModule,
    EpcisModule,
    EpciNeighborsModule,
    EpciGroupsModule,
    SimulationsModule,
    ShareLinksModule,
    CalculationModule,
    ResultsModule,
    DemographicEvolutionModule,
    DemographicEvolutionCustomModule,
    AccommodationRatesModule,
    VacancyModule,
    BassinModule,
    DataPackVersionsModule,
    DataVisualisationModule,
    RpInseeModule,
    FilocomModule,
    BadQualityModule,
    HostedModule,
    NoAccommodationModule,
    FinancialInadequationModule,
    PhysicalInadequationModule,
    EmailModule,
    FeedbackModule,
    CronModule,
    AdminModule,
    StatisticsModule,
    ExportExcelModule,
    ExportPowerpointModule,
    SitadelModule,
    HouseholdSizesModule,
    ConsumersModule,
    ExternalModule,
  ],
  providers: [
    // AuthorizationGuard for role-based access control
    AuthorizationGuard,
    {
      provide: APP_GUARD,
      useExisting: AuthorizationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class MainModule {}
