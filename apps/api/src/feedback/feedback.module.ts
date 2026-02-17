import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

@Module({
  controllers: [FeedbackController],
  imports: [PrismaModule],
  providers: [FeedbackService],
})
export class FeedbackModule {}
