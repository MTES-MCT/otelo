import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '~/db/prisma.module'
import { ImportBackupCommand } from './commands/import-backup.command'
import { ScalingoBackupService } from './services/scalingo-backup.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
    PrismaModule,
  ],
  providers: [ScalingoBackupService, ImportBackupCommand],
  exports: [ImportBackupCommand],
})
export class CliModule {}
