import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AccommodationRatesModule } from '~/accommodation-rates/accommodation-rates.module'
import { CoefficientCalculationModule } from '~/calculation/coefficient-calculation/coefficient-calculation.module'
import { NeedsCalculationCliModule } from '~/calculation/needs-calculation/needs-calculation-cli.module'
import { PrismaModule } from '~/db/prisma.module'
import { EpciGroupsModule } from '~/epci-groups/epci-groups.module'
import { ResultsService } from '~/results/results.service'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationChangesService } from '~/simulations/simulation-changes.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { BackfillEpcisGeoCommand } from './commands/backfill-epcis-geo.command'
import { ImportBackupCommand } from './commands/import-backup.command'
import { ImportCsvCommand } from './commands/import-csv.command'
import { ImportProjectionsCommand } from './commands/import-projections.command'
import { RecalculateResultsCommand } from './commands/recalculate-results.command'
import { SyncDocurbaCommand } from './commands/sync-docurba.command'
import { UpdateUserTypesCommand } from './commands/update-user-types.command'
import { ScalingoBackupService } from './services/scalingo-backup.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
    PrismaModule,
    NeedsCalculationCliModule,
    CoefficientCalculationModule,
    ScenariosModule,
    EpciGroupsModule,
    AccommodationRatesModule,
  ],
  providers: [
    ScalingoBackupService,
    BackfillEpcisGeoCommand,
    ImportBackupCommand,
    ImportCsvCommand,
    ImportProjectionsCommand,
    RecalculateResultsCommand,
    SyncDocurbaCommand,
    UpdateUserTypesCommand,
    ResultsService,
    SimulationsService,
    SimulationChangesService,
  ],
  exports: [
    BackfillEpcisGeoCommand,
    ImportBackupCommand,
    ImportCsvCommand,
    ImportProjectionsCommand,
    RecalculateResultsCommand,
    SyncDocurbaCommand,
    UpdateUserTypesCommand,
  ],
})
export class CliModule {}
