import { TFlowRequirementChartData } from '~/schemas/results'

export const calculateFlowResultsForEpci = (data: TFlowRequirementChartData, totalFlux: number) => {
  return {
    demographicEvolution: data.totals.demographicEvolution,
    renewalNeeds: data.totals.renewalNeeds,
    secondaryResidenceAccomodationEvolution: data.totals.secondaryResidenceAccomodationEvolution,
    totalFlux,
    vacantAccomodationEvolution: data.totals.vacantAccomodation,
    shortTermVacantAccomodation: data.totals.shortTermVacantAccomodation,
    longTermVacantAccomodation: data.totals.longTermVacantAccomodation,
  }
}
