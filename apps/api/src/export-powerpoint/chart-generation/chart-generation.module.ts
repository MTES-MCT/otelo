import { Module } from '@nestjs/common'
import { ChartGenerationService } from './chart-generation.service'

@Module({
  providers: [ChartGenerationService],
  exports: [ChartGenerationService],
})
export class ChartGenerationModule {}
