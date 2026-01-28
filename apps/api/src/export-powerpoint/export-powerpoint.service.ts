import { Injectable, Logger, Scope } from '@nestjs/common'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { DataVisualisationService } from '~/data-visualisation/data-visualisation.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { EpcisService } from '~/epcis/epcis.service'
import { getOmphaleKey } from '~/export-excel/helpers/labels'
import { PlaceholderGenerationService } from '~/export-powerpoint/placeholder-generation/placeholder-generation.service'
import { ZipService } from '~/export-powerpoint/zip/zip.service'
import { RpInseeService } from '~/rp-insee/rp-insee.service'
import { TLayout, TPowerpointData, TPowerpointPlaceholders } from '~/schemas/export-powerpoint/export-powerpoint'
import { TResults } from '~/schemas/results/results'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { SimulationsService } from '~/simulations/simulations.service'

interface CommonSlideData {
  baseLayout: TLayout
  privilegedScenario: TSimulationWithEpciAndScenario
  results: Record<string, TResults>
  epcis: Array<{ code: string; name: string; region: string; bassinName: string | null }>
  data: TPowerpointData
  simulations: Array<TSimulationWithEpciAndScenario>
  mainEpci: { code: string; name: string }
}

@Injectable({ scope: Scope.REQUEST })
export class ExportPowerpointService {
  private readonly logger = new Logger(ExportPowerpointService.name)
  constructor(
    private readonly zipService: ZipService,
    private readonly placeholderService: PlaceholderGenerationService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly epcisService: EpcisService,
    private readonly needsCalculationService: NeedsCalculationService,
    private readonly simulationService: SimulationsService,
    private readonly dataVisualisationService: DataVisualisationService,
    private readonly rpInseeService: RpInseeService,
    private readonly accommodationRatesService: AccommodationRatesService,
  ) {}

  private readonly slideCalculators = {
    slide1: this.calculateSlide1Data.bind(this),
    slide2: this.calculateSlide2Data.bind(this),
    slide4: this.calculateSlide4Data.bind(this),
    slide6: this.calculateSlide6Data.bind(this),
    slide8: this.calculateSlide8Data.bind(this),
    slide9: this.calculateSlide9Data.bind(this),
    slide10: this.calculateSlide10Data.bind(this),
    slide11: this.calculateSlide11Data.bind(this),
    slide12: this.calculateSlide12Data.bind(this),
    slide13: this.calculateSlide13Data.bind(this),
    slide14: this.calculateSlide14Data.bind(this),
    slide15: this.calculateSlide15Data.bind(this),
    slide16: this.calculateSlide16Data.bind(this),
    slide17: this.calculateSlide17Data.bind(this),
    slide18: this.calculateSlide18Data.bind(this),
    slide19: this.calculateSlide19Data.bind(this),
    slide20: this.calculateSlide20Data.bind(this),
    slide21: this.calculateSlide21Data.bind(this),
    slide22: this.calculateSlide22Data.bind(this),
    slide23: this.calculateSlide23Data.bind(this),
    slide24: this.calculateSlide24Data.bind(this),
    slide25: this.calculateSlide25Data.bind(this),
    slide26: this.calculateSlide26Data.bind(this),
    slide27: this.calculateSlide27Data.bind(this),
    slide28: this.calculateSlide28Data.bind(this),
    slide30: this.calculateSlide30Data.bind(this),
  }

  private getScenarioLabel(b2_scenario: string) {
    const scenarioPrefix = b2_scenario.split('_')[0]
    if (scenarioPrefix.startsWith('PH')) return 'Accélération'
    if (scenarioPrefix.startsWith('Central')) return 'Tendanciel'
    return 'Décélération'
  }

  private async prepareCommonData(data: TPowerpointData): Promise<CommonSlideData> {
    const simulations = await this.simulationService.getMany(data.selectedSimulations)
    const bassinEpcis = await this.epcisService.getBassinEpcisByEpciCode(data.epci.code)
    const epcis = bassinEpcis.map((epci) => ({
      code: epci.code,
      name: epci.name,
      region: epci.region,
      bassinName: epci.bassinName,
    }))
    const privilegedScenario = await this.simulationService.get(data.privilegedSimulation)

    const simulationPromises = simulations.map(async (simulation) => ({
      id: simulation.id,
      name: simulation.name,
      result: await this.needsCalculationService.calculate(simulation),
    }))

    const results = (await Promise.all(simulationPromises)).reduce((acc, { id, name, result }) => {
      acc[id] = { ...result, name }
      return acc
    }, {})

    const baseLayout: TLayout = {
      layoutEpciName: data.epci.name,
      layoutBassinName: epcis.find((epci) => epci.code === data.epci.code)?.bassinName ?? 'N/C',
      layoutStart: data.periodStart,
      layoutEnd: data.periodEnd,
      layoutDocumentType: data.documentType,
    }

    return {
      baseLayout,
      privilegedScenario,
      simulations,
      results,
      epcis,
      mainEpci: data.epci,
      data,
    }
  }

  private calculateSlide1Data(commonData: CommonSlideData) {
    const { baseLayout, data } = commonData
    const formattedDate = data.resultDate
    const period = `${baseLayout.layoutStart}-${baseLayout.layoutEnd}`

    return {
      text: {
        selectedEpciName: baseLayout.layoutEpciName,
        documentType: baseLayout.layoutDocumentType,
        period,
        date: formattedDate,
      },
    }
  }

  private calculateSlide2Data(commonData: CommonSlideData) {
    const { privilegedScenario, data } = commonData
    return {
      text: {
        privilegedScenario: privilegedScenario.name,
        nb: String(data.selectedSimulations.length),
      },
    }
  }

  private calculateSlide4Data(commonData: CommonSlideData) {
    const { results, baseLayout, data, privilegedScenario } = commonData
    const epciFlowRequirement = results[privilegedScenario.id].flowRequirement.epcis.find((epci) => epci.code === data.epci.code)
    const epcisTotals = results[privilegedScenario.id].epcisTotals.find((epci) => epci.epciCode === data.epci.code)

    let nbNew = 0
    let nbSupp = 0

    if (epciFlowRequirement) {
      const startYear = parseInt(data.periodStart)
      const endYear = parseInt(data.periodEnd)

      for (let year = startYear; year <= endYear; year++) {
        const yearStr = year.toString()
        nbNew += epciFlowRequirement.data.housingNeeds[yearStr] || 0
        nbSupp += epciFlowRequirement.data.surplusHousing[yearStr] || 0
      }
    }

    let percentMenages = ''
    let percentBadHousing = ''
    let percentFluidity = ''

    if (epciFlowRequirement && epcisTotals) {
      epciFlowRequirement.totals.vacantAccomodation
      percentMenages = ((epciFlowRequirement.totals.demographicEvolution / epcisTotals.totalFlux) * 100).toFixed(1)
      percentBadHousing = ((epcisTotals.totalStock / epcisTotals.total) * 100).toFixed(1)
      percentFluidity = ((epciFlowRequirement.totals.shortTermVacantAccomodation / epcisTotals.totalFlux) * 100).toFixed(1)
    }

    return {
      text: {
        ...baseLayout,
        start: baseLayout.layoutStart,
        end: baseLayout.layoutEnd,
        nb: nbSupp.toString(),
        nbNew: nbNew.toString(),
        nbSupp: (nbNew + nbSupp).toString(),
        percentMenages,
        nbMenages: epciFlowRequirement?.totals.demographicEvolution.toString() || '0',
        percentBadHousing,
        nbResorption: epcisTotals?.totalStock.toString() || '0',
        percentFluidity,
        peakYear: baseLayout.layoutEnd,
        privilegedScenario: commonData.privilegedScenario.name,
        orgName: data.username,
      },
    }
  }

  private calculateSlide6Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout, territory: commonData.data.epci.name },
    }
  }

  private async calculateSlide8Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide9Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private async calculateSlide10Data(commonData: CommonSlideData) {
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const data = await this.demographicEvolutionService.getDemographicEvolutionPopulationAndYear(epcis)
    const evolutionData = data.tableData[epciCode]?.annualEvolution
    const demographicData = await this.demographicEvolutionService.getDemographicEvolutionPopulationByEpci(epciCode)
    const chartData = demographicData[epciCode]

    return {
      text: {
        ...commonData.baseLayout,
        pb1: evolutionData['2021-2030'].basse.percent,
        pb2: evolutionData['2030-2040'].basse.percent,
        pb3: evolutionData['2040-2050'].basse.percent,
        pc1: evolutionData['2021-2030'].central.percent,
        pc2: evolutionData['2030-2040'].central.percent,
        pc3: evolutionData['2040-2050'].central.percent,
        ph1: evolutionData['2021-2030'].haute.percent,
        ph2: evolutionData['2030-2040'].haute.percent,
        ph3: evolutionData['2040-2050'].haute.percent,
      },
      charts: [
        {
          data: chartData.data,
          metadata: chartData.metadata,
          templateImageFileName: 'image9.png',
          width: 527,
          height: 322,
          type: 'projection-population-evolution',
        },
      ],
    }
  }

  private async calculateSlide11Data(commonData: CommonSlideData) {
    const scenario = commonData.privilegedScenario.scenario.b2_scenario
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const hauteDemographicEvolution = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(epcis, 'haute')
    const basseDemographicEvolution = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(epcis, 'basse')
    const centralDemographicEvolution = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(epcis, 'central')

    const centralData = centralDemographicEvolution.tableData[epciCode]
    const hauteData = hauteDemographicEvolution.tableData[epciCode]
    const basseData = basseDemographicEvolution.tableData[epciCode]

    let selectedDemographicEvolution
    const scenarioPrefix = scenario.split('_')[0]

    switch (scenarioPrefix) {
      case 'PH':
        selectedDemographicEvolution = hauteDemographicEvolution
        break
      case 'PB':
        selectedDemographicEvolution = basseDemographicEvolution
        break
      case 'PC':
      default:
        selectedDemographicEvolution = centralDemographicEvolution
        break
    }

    const chartData = selectedDemographicEvolution.linearChart
    return {
      text: {
        ...commonData.baseLayout,
        // Pop. Centrale - Décohabitation accélérée (haute)
        pcA1: centralData.annualEvolution['2021-2030'].haute.percent,
        pcA2: centralData.annualEvolution['2030-2040'].haute.percent,
        pcA3: centralData.annualEvolution['2040-2050'].haute.percent,
        // Pop. Centrale - Décohabitation tendancielle (central)
        pcT1: centralData.annualEvolution['2021-2030'].central.percent,
        pcT2: centralData.annualEvolution['2030-2040'].central.percent,
        pcT3: centralData.annualEvolution['2040-2050'].central.percent,
        // Pop. Centrale - Décohabitation décélérée (basse)
        pcD1: centralData.annualEvolution['2021-2030'].basse.percent,
        pcD2: centralData.annualEvolution['2030-2040'].basse.percent,
        pcD3: centralData.annualEvolution['2040-2050'].basse.percent,
        // Pop. Haute - Décohabitation tendancielle
        phT1: hauteData.annualEvolution['2021-2030'].central.percent,
        phT2: hauteData.annualEvolution['2030-2040'].central.percent,
        phT3: hauteData.annualEvolution['2040-2050'].central.percent,
        // Pop. Basse - Décohabitation tendancielle
        pbT1: basseData.annualEvolution['2021-2030'].central.percent,
        pbT2: basseData.annualEvolution['2030-2040'].central.percent,
        pbT3: basseData.annualEvolution['2040-2050'].central.percent,
      },
      charts: [
        {
          data: chartData,
          templateImageFileName: 'image10.png',
          width: 527,
          height: 322,
          type: 'projection-menages-evolution',
        },
      ],
    }
  }

  private async calculateSlide12Data(commonData: CommonSlideData) {
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const data = await this.dataVisualisationService.getInadequateHousing(epcis)
    return {
      text: { ...commonData.baseLayout },
      charts: [
        {
          data: data[epciCode],
          templateImageFileName: 'image11.png',
          width: 700,
          height: 372,
          type: 'bad-housing',
        },
      ],
    }
  }

  private calculateSlide13Data(commonData: CommonSlideData) {
    return {
      text: {
        nb: `${commonData.data.selectedSimulations.length}`,
      },
    }
  }

  private async calculateSlide14Data(commonData: CommonSlideData) {
    const getDecohabitationScenarioLabel = (scenario: string) => {
      if (scenario.endsWith('_B')) return 'Décohabitation décélérée'
      if (scenario.endsWith('_H')) return 'Décohabitation accélérée'
      return 'Tendance actuelle'
    }

    const getDemographicEvolution = (b2_scenario: string): 'haute' | 'basse' | 'central' => {
      const prefix = b2_scenario.split('_')[0]
      if (prefix === 'PH') return 'haute'
      if (prefix === 'PB') return 'basse'
      return 'central'
    }

    const processSimulation = async (simulation: TSimulationWithEpciAndScenario | null, epciCode: string) => {
      if (!simulation) return { hab: '', prin: '', vacance: '', rs: '', resorb: '' }

      const demographicEvolution = getDemographicEvolution(simulation.scenario.b2_scenario)
      const projectionYear = simulation.scenario.projection
      const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)

      const habData = demographicData[epciCode]?.data.find((d) => d.year === projectionYear)
      const hab = habData?.[demographicEvolution]?.toString() || ''

      const demographicEvolutionData = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(
        epcis,
        demographicEvolution,
      )
      const prinData = demographicEvolutionData.linearChart?.[epciCode]?.data.find((d) => d.year === projectionYear)
      const prin = prinData?.[getOmphaleKey(simulation.scenario.b2_scenario)]?.toString() || ''

      const epciScenario = simulation.scenario.epciScenarios.find((es) => es.epciCode === epciCode)

      // Calculate vacancy rate reduction percentage
      let vacance = ''
      if (epciScenario?.b2_tx_vacance_longue !== undefined) {
        try {
          const accommodationRates = await this.accommodationRatesService.getAccommodationRates(epciCode)
          const defaultLongTermRate = accommodationRates[epciCode]?.longTermVacancyRate

          if (defaultLongTermRate && defaultLongTermRate > 0) {
            const currentRate = epciScenario.b2_tx_vacance_longue
            const reduction = defaultLongTermRate - currentRate
            const reductionPercentage = (reduction / defaultLongTermRate) * 100
            const formattedReduction = Math.round(reductionPercentage * 100) / 100

            vacance = `${(currentRate * 100).toFixed(2)}% (soit une réduction de ${formattedReduction}%)`
          } else {
            vacance = `${(epciScenario.b2_tx_vacance_longue * 100).toFixed(2)}%`
          }
        } catch (error) {
          this.logger.error(`Failed to calculate vacancy reduction for ${epciCode}:`, error)
          vacance = `${(epciScenario.b2_tx_vacance_longue * 100).toFixed(2)}%`
        }
      }

      const rs = epciScenario?.b2_tx_rs.toString() || ''
      const resorb = simulation.scenario.b1_horizon_resorption.toString()

      return { hab, prin, vacance, rs, resorb }
    }

    const { data, simulations, privilegedScenario } = commonData
    const epciCode = data.epci.code
    const othersSimulations = simulations.filter((sim) => sim.id !== privilegedScenario.id)
    const [firstSimulation, lastSimulation] = othersSimulations

    const demographicData = await this.demographicEvolutionService.getDemographicEvolutionPopulationByEpci(epciCode)

    const [sim1Data, sim2Data, sim3Data] = await Promise.all([
      processSimulation(firstSimulation, epciCode),
      processSimulation(privilegedScenario, epciCode),
      processSimulation(lastSimulation, epciCode),
    ])

    return {
      text: {
        ...commonData.baseLayout,
        horizon: `${commonData.baseLayout.layoutStart}-${commonData.baseLayout.layoutEnd}`,
        nb: commonData.data.selectedSimulations.length.toString(),
        scenarioName1: firstSimulation?.name || '',
        scenarioName2: privilegedScenario.name,
        scenarioName3: lastSimulation?.name || '',
        scenario1: firstSimulation ? this.getScenarioLabel(firstSimulation.scenario.b2_scenario) : '',
        scenario2: this.getScenarioLabel(privilegedScenario.scenario.b2_scenario),
        scenario3: lastSimulation ? this.getScenarioLabel(lastSimulation.scenario.b2_scenario) : '',
        evol1: firstSimulation ? getDecohabitationScenarioLabel(firstSimulation.scenario.b2_scenario) : '',
        evol2: getDecohabitationScenarioLabel(privilegedScenario.scenario.b2_scenario),
        evol3: lastSimulation ? getDecohabitationScenarioLabel(lastSimulation.scenario.b2_scenario) : '',
        hab1: sim1Data.hab,
        hab2: sim2Data.hab,
        hab3: sim3Data.hab,
        prin1: sim1Data.prin,
        prin2: sim2Data.prin,
        prin3: sim3Data.prin,
        vacance1: (Number(sim1Data.vacance) * 100).toFixed(2),
        vacance2: (Number(sim2Data.vacance) * 100).toFixed(2),
        vacance3: (Number(sim3Data.vacance) * 100).toFixed(2),
        rs1: (Number(sim1Data.rs) * 100).toFixed(2),
        rs2: (Number(sim2Data.rs) * 100).toFixed(2),
        rs3: (Number(sim3Data.rs) * 100).toFixed(2),
        resorb1: sim1Data.resorb,
        resorb2: sim2Data.resorb,
        resorb3: sim3Data.resorb,
        menagesHorizon1: 'VOIR AVEC LUC',
        menagesHorizon2: 'VOIR AVEC LUC',
        menagesHorizon3: 'VOIR AVEC LUC',
        privilegedScenario: privilegedScenario.name,
      },
    }
  }

  private async calculateSlide15Data(commonData: CommonSlideData) {
    const getScenarioLabel = (b2_scenario: string): string => {
      const scenarioPrefix = b2_scenario.split('_')[0]
      if (scenarioPrefix.startsWith('PH')) return 'Acceleration'
      if (scenarioPrefix.startsWith('Central')) return 'Tendanciel'
      return 'Deceleration'
    }

    const calculateHousingSum = (projection: number, flowRequirement: { data: { housingNeeds: Record<string, number> } }): number => {
      let sum = 0
      for (let year = 2021; year <= projection; year++) {
        sum += flowRequirement.data.housingNeeds[year.toString()] || 0
      }
      return sum
    }

    const processSimulationData = (simulation: TSimulationWithEpciAndScenario | null, epciCode: string) => {
      if (!simulation)
        return {
          demographic: 0,
          fluidity: 0,
          secondary: 0,
          housingNeeds: 0,
          vacant: 0,
          total: 0,
          newHousing: 0,
          badHousing: 0,
        }

      const flowRequirement = results[simulation.id]?.flowRequirement.epcis.find((epci) => epci.code === epciCode)
      if (!flowRequirement)
        return {
          demographic: 0,
          fluidity: 0,
          secondary: 0,
          housingNeeds: 0,
          vacant: 0,
          total: 0,
          newHousing: 0,
          badHousing: 0,
        }

      const housingSum = calculateHousingSum(simulation.scenario.projection, flowRequirement)
      const renewalNeeds = flowRequirement.totals.renewalNeeds
      const demographic = flowRequirement.totals.demographicEvolution
      const fluidity = flowRequirement.totals.shortTermVacantAccomodation
      const secondary = flowRequirement.totals.secondaryResidenceAccomodationEvolution
      const housingNeedsValue = flowRequirement.totals.housingNeeds
      const vacant = flowRequirement.totals.longTermVacantAccomodation

      // Calculate bad housing as sum of all housing inadequation types
      const hostedEpci = results[simulation.id].hosted.epcis.find((epci) => epci.epciCode === epciCode)
      const noAccommodationEpci = results[simulation.id].noAccomodation.epcis.find((epci) => epci.epciCode === epciCode)
      const badQualityEpci = results[simulation.id].badQuality.epcis.find((epci) => epci.epciCode === epciCode)
      const financialInadequationEpci = results[simulation.id].financialInadequation.epcis.find((epci) => epci.epciCode === epciCode)
      const physicalInadequationEpci = results[simulation.id].physicalInadequation.epcis.find((epci) => epci.epciCode === epciCode)

      const badHousing =
        (hostedEpci?.prorataValue || 0) +
        (noAccommodationEpci?.prorataValue || 0) +
        (badQualityEpci?.prorataValue || 0) +
        (financialInadequationEpci?.prorataValue || 0) +
        (physicalInadequationEpci?.prorataValue || 0)

      const total = demographic + fluidity + housingNeedsValue + vacant + secondary + housingSum

      return {
        demographic,
        fluidity,
        secondary,
        housingNeeds: housingNeedsValue,
        vacant,
        total,
        newHousing: renewalNeeds,
        badHousing,
      }
    }

    const { data, simulations, results, privilegedScenario } = commonData
    const epciCode = data.epci.code
    const othersSimulations = simulations.filter((sim) => sim.id !== privilegedScenario.id)
    const [firstSimulation, lastSimulation] = othersSimulations

    const sim1Data = processSimulationData(firstSimulation, epciCode)
    const sim2Data = processSimulationData(privilegedScenario, epciCode)
    const sim3Data = processSimulationData(lastSimulation, epciCode)

    return {
      text: {
        ...commonData.baseLayout,
        start: commonData.baseLayout.layoutStart,
        end: commonData.baseLayout.layoutEnd,
        scenario1: firstSimulation ? getScenarioLabel(firstSimulation.scenario.b2_scenario) : '',
        scenario2: getScenarioLabel(privilegedScenario.scenario.b2_scenario),
        scenario3: lastSimulation ? getScenarioLabel(lastSimulation.scenario.b2_scenario) : '',
        newHousing1: sim1Data.newHousing.toString(),
        newHousing2: sim2Data.newHousing.toString(),
        newHousing3: sim3Data.newHousing.toString(),
        demographic1: sim1Data.demographic.toString(),
        demographic2: sim2Data.demographic.toString(),
        demographic3: sim3Data.demographic.toString(),
        fluidity1: sim1Data.fluidity.toString(),
        fluidity2: sim2Data.fluidity.toString(),
        fluidity3: sim3Data.fluidity.toString(),
        badHousing1: sim1Data.badHousing.toString(),
        badHousing2: sim2Data.badHousing.toString(),
        badHousing3: sim3Data.badHousing.toString(),
        secondary1: sim1Data.secondary.toString(),
        secondary2: sim2Data.secondary.toString(),
        secondary3: sim3Data.secondary.toString(),
        housingNeeds1: sim1Data.housingNeeds.toString(),
        housingNeeds2: sim2Data.housingNeeds.toString(),
        housingNeeds3: sim3Data.housingNeeds.toString(),
        vacant1: sim1Data.vacant.toString(),
        vacant2: sim2Data.vacant.toString(),
        vacant3: sim3Data.vacant.toString(),
        total1: sim1Data.total.toString(),
        total2: sim2Data.total.toString(),
        total3: sim3Data.total.toString(),
      },
    }
  }

  private calculateSlide16Data(commonData: CommonSlideData) {
    const { results } = commonData
    return {
      text: {
        ...commonData.baseLayout,
        start: commonData.baseLayout.layoutStart,
        end: commonData.baseLayout.layoutEnd,
      },
      charts: [
        {
          data: results,
          templateImageFileName: 'image12.png',
          width: 620,
          height: 350,
          type: 'annual-needs-comparison',
        },
      ],
    }
  }

  private calculateSlide17Data(commonData: CommonSlideData) {
    const { privilegedScenario } = commonData

    return {
      text: { ...commonData.baseLayout, scenario: this.getScenarioLabel(privilegedScenario.scenario.b2_scenario) },
    }
  }

  private calculateSlide18Data(commonData: CommonSlideData) {
    const { privilegedScenario } = commonData
    return {
      text: {
        ...commonData.baseLayout,
        privilegedScenario: privilegedScenario.name,
      },
    }
  }

  private calculateSlide19Data(commonData: CommonSlideData) {
    const { data, results, privilegedScenario } = commonData
    const epciCode = data.epci.code

    // Get flow requirement data for this EPCI
    const flowRequirement = results[privilegedScenario.id].flowRequirement.epcis.find((epci) => epci.code === epciCode)

    const startYear = parseInt(data.periodStart)
    const endYear = parseInt(data.periodEnd)
    const projectionYear = privilegedScenario.scenario.projection

    let nb1Sum = 0 // Sum from 2021 to docStart-1
    let nb1Count = 0 // Count of years for average
    let nb2Sum = 0 // Sum from docStart to docEnd (for average calculation)
    let nb2Count = 0 // Count of years for average
    let nb3 = 0 // Sum from docEnd+1 to projection

    if (flowRequirement) {
      // nb1: Sum from 2021 to docStart-1
      for (let year = 2021; year < startYear; year++) {
        const yearStr = year.toString()
        nb1Sum += flowRequirement.data.housingNeeds[yearStr] || 0
        nb1Count++
      }

      // nb2: Calculate sum for docStart to docEnd (will calculate average later)
      for (let year = startYear; year <= endYear; year++) {
        const yearStr = year.toString()
        nb2Sum += flowRequirement.data.housingNeeds[yearStr] || 0
        nb2Count++
      }

      // nb3: Sum from docEnd+1 to projection
      for (let year = endYear + 1; year <= projectionYear; year++) {
        const yearStr = year.toString()
        nb3 += flowRequirement.data.housingNeeds[yearStr] || 0
      }
    }
    const nb1 = nb1Count > 0 ? Math.round(nb1Sum / nb1Count) : 0
    // Calculate average for nb2
    const nb2 = nb2Count > 0 ? Math.round(nb2Sum / nb2Count) : 0
    const total = nb2Sum

    return {
      text: {
        ...commonData.baseLayout,
        'docStart-1': String(startYear - 1),
        docStart: data.periodStart,
        docEnd: data.periodEnd,
        docEnd2: String(endYear + 1),
        projection: projectionYear.toString(),
        total: total.toString(),
        nb1: nb1.toString(),
        nb2: nb2.toString(),
        nb3: nb3.toString(),
        scenario: this.getScenarioLabel(privilegedScenario.scenario.b2_scenario),
      },
    }
  }

  private calculateSlide20Data(commonData: CommonSlideData) {
    const { privilegedScenario, mainEpci, results } = commonData
    const sitadelResults = results[privilegedScenario.id].sitadel.epcis.find((e) => e.code === mainEpci.code)
    const newConstructionsResults = results[privilegedScenario.id].flowRequirement.epcis.find((e) => e.code === mainEpci.code)

    const data = {
      sitadelData: sitadelResults?.data || [],
      newConstructionsData: newConstructionsResults?.data || [],
      horizon: privilegedScenario.scenario.projection,
    }

    return {
      text: { ...commonData.baseLayout, scenario: this.getScenarioLabel(privilegedScenario.scenario.b2_scenario) },
      charts: [
        {
          data,
          templateImageFileName: 'image13.png',
          width: 620,
          height: 350,
          type: 'annual-needs',
        },
      ],
    }
  }

  private calculateSlide21Data(commonData: CommonSlideData) {
    const { data, results, privilegedScenario } = commonData
    const epciCode = data.epci.code

    // Get flow requirement data for this EPCI
    const flowRequirement = results[privilegedScenario.id].flowRequirement.epcis.find((epci) => epci.code === epciCode)

    let nbFluid = 0
    let nbRs = 0
    let nbUrb = 0
    let nbVac = 0
    let nb = 0
    let total = 0

    if (flowRequirement) {
      // Use the same calculations as in calculateSlide15Data
      nbFluid = flowRequirement.totals.vacantAccomodation // fluidity
      nbRs = flowRequirement.totals.secondaryResidenceAccomodationEvolution // secondary
      nbUrb = flowRequirement.totals.housingNeeds // housingNeedsValue
      nbVac = flowRequirement.totals.longTermVacantAccomodation // vacant

      // Calculate total as newHousing (sum from docStart to projection year)
      const startYear = parseInt(data.periodStart)
      const projectionYear = privilegedScenario.scenario.projection

      for (let year = startYear; year <= projectionYear; year++) {
        const yearStr = year.toString()
        nb += flowRequirement.data.housingNeeds[yearStr] || 0
      }
      total = nb // total = newHousing
    }

    return {
      text: {
        ...commonData.baseLayout,
        scenario: this.getScenarioLabel(privilegedScenario.scenario.b2_scenario),
        nbNv: 'Voir avec luc',
        nbFluid: nbFluid.toString(),
        nbRs: nbRs.toString(),
        nbUrb: nbUrb.toString(),
        nbVac: nbVac.toString(),
        nb: nb.toString(),
        projection: privilegedScenario.scenario.projection.toString(),
        total: total.toString(),
        dperc: '200',
      },
    }
  }

  private calculateSlide22Data(commonData: CommonSlideData) {
    const { data, results, privilegedScenario } = commonData
    const epciCode = data.epci.code

    // Get prorata values from results
    const hostedEpci = results[privilegedScenario.id].hosted.epcis.find((epci) => epci.epciCode === epciCode)
    const noAccommodationEpci = results[privilegedScenario.id].noAccomodation.epcis.find((epci) => epci.epciCode === epciCode)
    const badQualityEpci = results[privilegedScenario.id].badQuality.epcis.find((epci) => epci.epciCode === epciCode)
    const financialInadequationEpci = results[privilegedScenario.id].financialInadequation.epcis.find((epci) => epci.epciCode === epciCode)
    const physicalInadequationEpci = results[privilegedScenario.id].physicalInadequation.epcis.find((epci) => epci.epciCode === epciCode)

    // Get total stock for percentage calculations
    const epciTotal = results[privilegedScenario.id].epcisTotals.find((epci) => epci.epciCode === epciCode)
    const totalStock = epciTotal?.totalStock || 1 // Avoid division by zero

    // Extract prorata values
    const nbHosted = hostedEpci?.prorataValue || 0
    const nbNoAccommodation = noAccommodationEpci?.prorataValue || 0
    const nbBadQuality = badQualityEpci?.prorataValue || 0
    const nbFinancialInadequation = financialInadequationEpci?.prorataValue || 0
    const nbPhysicalInadequation = physicalInadequationEpci?.prorataValue || 0

    // Calculate percentages
    const percentHosted = ((nbHosted / totalStock) * 100).toFixed(1)
    const percentNoAcc = ((nbNoAccommodation / totalStock) * 100).toFixed(1)
    const percentBadQ = ((nbBadQuality / totalStock) * 100).toFixed(1)
    const percentFI = ((nbFinancialInadequation / totalStock) * 100).toFixed(1)
    const percentPI = ((nbPhysicalInadequation / totalStock) * 100).toFixed(1)

    // Get resorbYear from scenario
    const resorbYear = privilegedScenario.scenario.b1_horizon_resorption

    // Calculate totals
    const totalSituations = nbHosted + nbNoAccommodation + nbBadQuality + nbFinancialInadequation + nbPhysicalInadequation

    return {
      text: {
        ...commonData.baseLayout,
        nbHosted: nbHosted.toString(),
        nbNoAccommodation: nbNoAccommodation.toString(),
        nbBadQuality: nbBadQuality.toString(),
        nbFinancialInadequation: nbFinancialInadequation.toString(),
        nbPhysicalInadequation: nbPhysicalInadequation.toString(),
        percentHosted,
        percentNoAcc,
        percentBadQ,
        percentFI,
        percentPI,
        resorbYear: resorbYear.toString(),
        total: totalStock.toString(),
        nbSituations: totalSituations.toString(),
        docStart: data.periodStart,
        docEnd: data.periodEnd,
      },
    }
  }

  private async calculateSlide23Data(commonData: CommonSlideData) {
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const data = await this.rpInseeService.getRP(epcis, 'vacant')

    return {
      text: { ...commonData.baseLayout },
      charts: [
        {
          data,
          templateImageFileName: 'image14.png',
          width: 650,
          height: 325,
          type: 'vacant-accommodation',
        },
      ],
    }
  }

  private calculateSlide24Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide25Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide26Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide27Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide28Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide30Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private async generatePlaceholders(data: TPowerpointData): Promise<TPowerpointPlaceholders> {
    const commonData = await this.prepareCommonData(data)
    const placeholders: Record<string, unknown> = {}

    for (const [slideKey, calculator] of Object.entries(this.slideCalculators)) {
      try {
        const result = calculator(commonData)
        placeholders[slideKey] = await result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined
        this.logger.error(`Failed to calculate ${slideKey}: ${errorMessage}`, errorStack)
      }
    }

    return placeholders as TPowerpointPlaceholders
  }

  async generateFromTemplate(data: TPowerpointData): Promise<Buffer> {
    const zip = await this.zipService.unzipPptx()
    const slideFiles = Object.keys(zip.files).filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))

    for (const slideFile of slideFiles) {
      this.logger.log(`Processing slide ${slideFile}`)
      const slideName = slideFile.split('/').pop()!.replace('.xml', '')
      const slideXml = await zip.files[slideFile].async('text')
      const placeholders = await this.generatePlaceholders(data)

      const modifiedSlideXml = await this.placeholderService.processSlide(slideXml, slideName, placeholders, zip)
      zip.file(slideFile, modifiedSlideXml)
    }

    this.logger.log(`Generating PowerPoint file`)
    const pptxBuffer = await this.zipService.generatePptx(zip)
    return pptxBuffer
  }
}
