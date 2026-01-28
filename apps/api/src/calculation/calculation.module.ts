import { Module } from '@nestjs/common'
import { CoefficientCalculationModule } from '~/calculation/coefficient-calculation/coefficient-calculation.module'
import { NeedsCalculationModule } from '~/calculation/needs-calculation/needs-calculation.module'
import { RatioCalculationModule } from '~/calculation/ratio-calculation/ratio-calculation.module'

@Module({
  imports: [CoefficientCalculationModule, RatioCalculationModule, NeedsCalculationModule],
})
export class CalculationModule {}
