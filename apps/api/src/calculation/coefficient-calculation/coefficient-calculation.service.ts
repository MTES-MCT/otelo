import { Inject, Injectable } from '@nestjs/common'
import { CoefficientConfig } from '~/calculation/coefficient-calculation/coefficient.config'

@Injectable()
export class CoefficientCalculationService {
  constructor(
    @Inject('COEFFICIENT_CONFIG')
    private readonly coefficientConfig: CoefficientConfig,
  ) {}

  calculateCoefficient(horizonResorption: number, projectionPeriod: number = 6): number {
    return projectionPeriod < horizonResorption ? projectionPeriod / horizonResorption : 1
  }

  calculateRenewalRate(currentRate: number, additionalRate: number, projectionPeriod: number, regionCode: string): number {
    const baseCoeff = this.coefficientConfig.baseCoeff[regionCode] ?? this.coefficientConfig.baseCoeff.default

    const annualRate = Math.round(((1.0 + currentRate) ** (1.0 / baseCoeff) - 1.0) * 1e10) / 1e10
    const adjustedAnnualRate = Math.round((annualRate + additionalRate / 100.0) * 1e10) / 1e10

    return Math.round(((1.0 + adjustedAnnualRate) ** projectionPeriod - 1.0) * 1e10) / 1e10
  }
}
