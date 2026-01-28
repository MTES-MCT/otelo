import { Module } from '@nestjs/common'
import { coefficientConfig } from '~/calculation/coefficient-calculation/coefficient.config'
import { CoefficientCalculationService } from '~/calculation/coefficient-calculation/coefficient-calculation.service'

@Module({
  exports: [CoefficientCalculationService],
  providers: [
    {
      provide: 'COEFFICIENT_CONFIG',
      useValue: coefficientConfig,
    },
    CoefficientCalculationService,
  ],
})
export class CoefficientCalculationModule {}
