import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from '~/db/prisma.module'
import { CronController } from './cron.controller'
import { CronService } from './cron.service'

@Module({
  imports: [ScheduleModule.forRoot(), HttpModule, ConfigModule, PrismaModule],
  providers: [CronService],
  exports: [CronService],
  controllers: [CronController],
})
export class CronModule {}
