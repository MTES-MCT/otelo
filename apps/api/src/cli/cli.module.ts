import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CoefficientCalculationModule } from '~/calculation/coefficient-calculation/coefficient-calculation.module'
import { NeedsCalculationCliModule } from '~/calculation/needs-calculation/needs-calculation-cli.module'
import { PrismaModule } from '~/db/prisma.module'
import { EpciGroupsModule } from '~/epci-groups/epci-groups.module'
import { ResultsService } from '~/results/results.service'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationsService } from '~/simulations/simulations.service'
import { ImportBackupCommand } from './commands/import-backup.command'
import { RecalculateResultsCommand } from './commands/recalculate-results.command'
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
  ],
  providers: [ScalingoBackupService, ImportBackupCommand, RecalculateResultsCommand, ResultsService, SimulationsService],
  exports: [ImportBackupCommand, RecalculateResultsCommand],
})
export class CliModule {}
