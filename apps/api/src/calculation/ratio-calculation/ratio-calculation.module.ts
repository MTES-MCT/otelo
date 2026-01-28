import { Module } from '@nestjs/common'
import { ratioConfig } from '~/calculation/ratio-calculation/ratio.config'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'

@Module({
  exports: [RatioCalculationService],
  providers: [
    {
      provide: 'RATIO_CONFIG',
      useValue: ratioConfig,
    },
    RatioCalculationService,
  ],
})
export class RatioCalculationModule {}
