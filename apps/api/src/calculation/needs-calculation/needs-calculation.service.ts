import { Injectable } from '@nestjs/common'
import { TFlowRequirementChartData } from '@shared'
import { FlowRequirementService } from '~/calculation/needs-calculation/besoins-flux/flow-requirement.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { TResults } from '~/schemas/results/results'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'

@Injectable()
export class NeedsCalculationService {
  constructor(
    private readonly flowRequirementService: FlowRequirementService,
    private readonly stockRequirementsService: StockRequirementsService,
    private readonly sitadelService: SitadelService,
  ) {}

  async calculate(simulation: TSimulationWithEpciAndScenario): Promise<TResults> {
    const stockRequirementsNeeds = await this.stockRequirementsService.calculateStock(simulation)
    const flowRequirement = await this.flowRequirementService.calculate(simulation, stockRequirementsNeeds)
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality } = stockRequirementsNeeds
    const sitadel = await this.sitadelService.calculate(simulation)
    let total = 0
    let totalStock = 0
    let totalFlux = 0
    let vacantAccomodation = 0
    let secondaryAccommodation = 0
    const epcisTotals = simulation.epcis.map((epci) => {
      const epciFlowRequirement = flowRequirement.epcis.find((e) => e.code === epci.code) as TFlowRequirementChartData

      const epciTotalFlux =
        epciFlowRequirement.totals.demographicEvolution +
        epciFlowRequirement.totals.renewalNeeds +
        epciFlowRequirement.totals.secondaryResidenceAccomodationEvolution +
        epciFlowRequirement.totals.longTermVacantAccomodation +
        epciFlowRequirement.totals.shortTermVacantAccomodation

      const peakYear = epciFlowRequirement.data.peakYear

      const epciTotalStock = this.stockRequirementsService.calculateProrataStockByEpci(
        simulation,
        epci.code,
        stockRequirementsNeeds,
        peakYear,
      )
      total += epciTotalFlux + (peakYear && peakYear > 2021 ? epciTotalStock.prePeakTotal : epciTotalStock.total)
      totalFlux += epciTotalFlux
      totalStock += peakYear && peakYear > 2021 ? epciTotalStock.prePeakTotal : epciTotalStock.total
      if (epciFlowRequirement.totals.longTermVacantAccomodation <= 0) {
        vacantAccomodation += epciFlowRequirement.totals.longTermVacantAccomodation
      }
      if (epciFlowRequirement.totals.longTermVacantAccomodation <= 0) {
        secondaryAccommodation += epciFlowRequirement.totals.secondaryResidenceAccomodationEvolution
      }

      return {
        epciCode: epci.code,
        total: epciTotalFlux + epciTotalStock.prePeakTotal,
        prepeakTotalStock: epciTotalStock.prePeakTotal,
        postpeakTotalStock: epciTotalStock.postPeakTotal,
        totalFlux: epciTotalFlux,
        totalStock: epciTotalStock.total,
        vacantAccomodation,
        secondaryAccommodation,
      }
    })

    return {
      badQuality,
      flowRequirement,
      epcisTotals,
      financialInadequation,
      hosted,
      noAccomodation,
      physicalInadequation,
      sitadel,
      total,
      totalFlux,
      totalStock,
      vacantAccomodation,
      secondaryAccommodation,
    }
  }
}
