import { TSimulationDashboardItem } from '~/schemas/simulation'

export interface PeriodGroup {
  periodKey: string
  millesime: string
  projection: number
  simulations: TSimulationDashboardItem[]
}

export function groupByPeriod(simulations: TSimulationDashboardItem[]): PeriodGroup[] {
  const map = new Map<string, PeriodGroup>()

  for (const simulation of simulations) {
    const { millesime, projection } = simulation.scenario
    const key = `${millesime}-${projection}`

    if (!map.has(key)) {
      map.set(key, {
        periodKey: key,
        millesime,
        projection,
        simulations: [],
      })
    }

    map.get(key)!.simulations.push(simulation)
  }

  return Array.from(map.values())
}
