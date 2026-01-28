import {
  TCalculationResult,
  TChartData,
  TChartDataResult,
  TFlowRequirementChartData,
  TFlowRequirementChartDataResult,
  TSitadelData,
  TSitadelDataResult,
} from '@shared'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

export interface CalculationContext {
  coefficient: number
  baseYear: number
}

export abstract class BaseCalculator<TCalculateArgs extends unknown[] = [], TCalculateByEpciArgs extends unknown[] = []> {
  constructor(protected readonly context: CalculationContext) {}

  abstract calculate(
    simulation: TSimulationWithEpciAndScenario,
    ...args: TCalculateArgs
  ): Promise<TCalculationResult | TChartDataResult | TFlowRequirementChartDataResult | TSitadelDataResult>
  abstract calculateByEpci(
    simulation: TSimulationWithEpciAndScenario,
    epciCode: string,
    ...args: TCalculateByEpciArgs
  ): Promise<number | TChartData | TFlowRequirementChartData | TSitadelData>

  protected applyCoefficient(value: number): number {
    return Math.round(value * this.context.coefficient)
  }
}
