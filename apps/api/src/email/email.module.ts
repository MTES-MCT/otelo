import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EmailController } from './email.controller'
import { EmailService } from './email.service'

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [EmailService],
  exports: [EmailService],
  controllers: [EmailController],
})
export class EmailModule {}
