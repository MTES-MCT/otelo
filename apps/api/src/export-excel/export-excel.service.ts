import { Injectable } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import {
  getBadHousingCategoryLabel,
  getHostedLabel,
  getMenagesLabel,
  getNoAccommodationLabel,
  getOmphaleKey,
  getPopulationKey,
  getPopulationLabel,
  getSource,
  getSurroccLabel,
} from '~/export-excel/helpers/labels'
import { B11Etablissement } from '~/generated/prisma/client'
import { ResultsService } from '~/results/results.service'
import { TResults } from '~/schemas/results/results'
import { TEpciScenario } from '~/schemas/scenarios/scenario'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

type CellStyle = 'sectionHeader' | 'dataCell' | 'importantValue' | 'standardBorder' | 'resultHeader'

interface CellConfig {
  cell: string
  value?: string | number
  style?: CellStyle
  merge?: string
  numFmt?: string
}

interface SectionConfig {
  title?: CellConfig
  headers?: CellConfig[]
  data?: CellConfig[]
}

class CellStyleHelper {
  static applySectionHeader(cell: ExcelJS.Cell): void {
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'BDD7EE' },
    }
    this.applyStandardBorder(cell)
  }

  static applyResultHeader(cell: ExcelJS.Cell): void {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    this.applyStandardBorder(cell)
  }

  static applyDataCell(cell: ExcelJS.Cell): void {
    this.applyStandardBorder(cell)
  }

  static applyImportantValue(cell: ExcelJS.Cell): void {
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF99' },
    }
    this.applyStandardBorder(cell)
  }

  static applyStandardBorder(cell: ExcelJS.Cell): void {
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    }
  }

  static applyTitleCell(cell: ExcelJS.Cell): void {
    cell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    }
    cell.border = {
      top: { style: 'thin', color: { argb: '4472C4' } },
      left: { style: 'thin', color: { argb: '4472C4' } },
      bottom: { style: 'thin', color: { argb: '4472C4' } },
      right: { style: 'thin', color: { argb: '4472C4' } },
    }
  }

  static applyCellConfig(worksheet: ExcelJS.Worksheet, config: CellConfig): void {
    if (config.merge) {
      worksheet.mergeCells(config.merge)
    }

    const cell = worksheet.getCell(config.cell)
    if (config.value !== undefined) {
      cell.value = config.value
    }
    if (config.numFmt) {
      cell.numFmt = config.numFmt
    }

    switch (config.style) {
      case 'sectionHeader':
        this.applySectionHeader(cell)
        break
      case 'resultHeader':
        this.applyResultHeader(cell)
        break
      case 'dataCell':
        this.applyDataCell(cell)
        break
      case 'importantValue':
        this.applyImportantValue(cell)
        break
      case 'standardBorder':
        this.applyStandardBorder(cell)
        break
    }
  }

  static applySectionConfig(worksheet: ExcelJS.Worksheet, config: SectionConfig): void {
    if (config.title) {
      this.applyCellConfig(worksheet, config.title)
    }
    config.headers?.forEach((header) => this.applyCellConfig(worksheet, header))
    config.data?.forEach((data) => this.applyCellConfig(worksheet, data))
  }
}

@Injectable()
export class ExportExcelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly resultsService: ResultsService,
    private readonly accommodationRatesService: AccommodationRatesService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
  ) {}

  private toPercentage(value: number): string {
    return (value * 100).toFixed(2)
  }

  private sanitizeWorksheetName(name: string): string {
    // Remove invalid characters for Excel worksheet names
    let sanitized = name.replace(/[\\\/\?\*\[\]]/g, '')

    // Remove single quotes from the beginning and end
    sanitized = sanitized.replace(/^'+|'+$/g, '')

    if (sanitized.length > 31) {
      sanitized = sanitized.substring(0, 31)
    }

    return sanitized
  }

  async createSyntheseSheet(workbook: ExcelJS.Workbook, simulation: TSimulationWithEpciAndScenario, results: TResults) {
    const syntheseWorksheet = workbook.addWorksheet('Ensemble des EPCI', {
      properties: { defaultColWidth: 25 },
    })

    // Title
    syntheseWorksheet.mergeCells('A1:G1')
    const titleCell = syntheseWorksheet.getCell('A1')
    titleCell.value = "Synthèse des besoins en logements pour l'ensemble des EPCI"
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    }
    titleCell.border = {
      top: { style: 'thin', color: { argb: '4472C4' } },
      left: { style: 'thin', color: { argb: '4472C4' } },
      bottom: { style: 'thin', color: { argb: '4472C4' } },
      right: { style: 'thin', color: { argb: '4472C4' } },
    }

    // Headers
    syntheseWorksheet.getRow(6).values = [
      'Code EPCI',
      'Nom EPCI',
      "Besoin lié à la démographie et à l'évolution du parc",
      'Besoin lié au mal-logement',
      'Besoin total en constructions neuves',
      'Besoin total en remobilisation',
      "Année à partir de laquelle le territoire n'a plus de besoin en logements",
    ]

    // Headers style
    const headerRow = syntheseWorksheet.getRow(6)
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    headerRow.height = 50

    // Headers borders
    for (let col = 1; col <= 7; col++) {
      const cell = syntheseWorksheet.getCell(6, col)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: '4472C4' } },
        left: { style: 'thin', color: { argb: '4472C4' } },
        bottom: { style: 'thin', color: { argb: '4472C4' } },
        right: { style: 'thin', color: { argb: '4472C4' } },
      }
    }
    // Data for each EPCI (line 7)
    let currentRow = 7
    let totalFluxSum = 0
    let totalStockSum = 0
    let totalVacantSum = 0
    let shouldSetLegend = false

    for (const epciScenario of simulation.scenario.epciScenarios) {
      const epciTotals = results.epcisTotals.find((epci) => epci.epciCode === epciScenario.epciCode)
      if (!epciTotals) {
        continue
      }

      const peakYear = results.flowRequirement.epcis.find((epci) => epci.code === epciScenario.epciCode)?.data.peakYear
      const peakYearDisplay = peakYear && simulation.scenario.projection <= peakYear ? '*' : peakYear
      shouldSetLegend = peakYearDisplay === '*'

      const dataRow = syntheseWorksheet.getRow(currentRow)
      dataRow.values = [
        epciScenario.epciCode,
        simulation.epcis.find((epci) => epci.code === epciScenario.epciCode)?.name,
        epciTotals.totalFlux, // Besoin démographique
        peakYear && peakYear > 2021 ? epciTotals.prepeakTotalStock : epciTotals.totalStock, // Besoin mal-logement
        epciTotals.totalFlux + (peakYear && peakYear > 2021 ? epciTotals.prepeakTotalStock : epciTotals.totalStock), // Total constructions neuves
        epciTotals.vacantAccomodation, // Total remobilisation
        peakYearDisplay, // Année du peak ou '*'
      ]

      // Style for data rows - alternating colors
      const isEvenRow = (currentRow - 6) % 2 === 0

      // Borders and style for all cells
      for (let col = 1; col <= 7; col++) {
        const cell = syntheseWorksheet.getCell(currentRow, col)
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }

        if (isEvenRow) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' },
          }
        }
      }

      // Special color for EPCI codes (first column)
      const epciCodeCell = syntheseWorksheet.getCell(currentRow, 1)
      epciCodeCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'BDD7EE' }, // Bleu clair
      }
      epciCodeCell.font = { bold: true }

      totalFluxSum += epciTotals.totalFlux
      totalStockSum += epciTotals.totalStock
      totalVacantSum += epciTotals.vacantAccomodation

      currentRow++
    }

    // Total row
    syntheseWorksheet.mergeCells(`A${currentRow}:B${currentRow}`)
    const totalRow = syntheseWorksheet.getRow(currentRow)
    totalRow.values = ['Ensemble des EPCI', '', totalFluxSum, totalStockSum, totalFluxSum + totalStockSum, totalVacantSum]

    // Total row style
    totalRow.font = { bold: true, color: { argb: 'FFFFFF' } }

    for (let col = 1; col <= 7; col++) {
      const cell = syntheseWorksheet.getCell(currentRow, col)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }, // Bleu foncé comme les headers
      }
      cell.border = {
        top: { style: 'thin', color: { argb: '4472C4' } },
        left: { style: 'thin', color: { argb: '4472C4' } },
        bottom: { style: 'thin', color: { argb: '4472C4' } },
        right: { style: 'thin', color: { argb: '4472C4' } },
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    }

    if (shouldSetLegend) {
      const explanationRow = currentRow + 1
      syntheseWorksheet.mergeCells(`G${explanationRow}:G${explanationRow}`)
      const explanationCell = syntheseWorksheet.getCell(`G${explanationRow}`)
      explanationCell.value = "* Le besoin en logements sur le territoire est positif sur l'ensemble de la période projetée"
      explanationCell.font = { size: 10, italic: true }
      explanationCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    }

    // col width
    syntheseWorksheet.getColumn('A').width = 15 // Code EPCI
    syntheseWorksheet.getColumn('B').width = 35 // Nom EPCI
    syntheseWorksheet.getColumn('C').width = 25 // Besoin démographique
    syntheseWorksheet.getColumn('D').width = 20 // Besoin mal-logement
    syntheseWorksheet.getColumn('E').width = 25 // Total constructions
    syntheseWorksheet.getColumn('F').width = 20 // Total remobilisation
    syntheseWorksheet.getColumn('G').width = 30 // Année fin besoin
  }

  async createEpciSheet(
    workbook: ExcelJS.Workbook,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ) {
    const epciWorksheet = this.initializeWorksheet(workbook, simulation, epciScenario)

    await this.createTitlesSection(epciWorksheet, simulation, epciScenario)
    await this.createParameterSection(epciWorksheet, simulation, epciScenario, results)
    await this.createResultsSection(epciWorksheet, simulation, epciScenario, results)
    await this.createAnnualizedNeedsSection(epciWorksheet, simulation, epciScenario, results)

    this.applyFinalStyling(epciWorksheet)
    this.setColumnWidths(epciWorksheet)
  }

  private initializeWorksheet(
    workbook: ExcelJS.Workbook,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
  ): ExcelJS.Worksheet {
    const epciName = simulation.epcis.find((epci) => epci.code === epciScenario.epciCode)?.name!
    const sanitizedName = this.sanitizeWorksheetName(epciName)
    return workbook.addWorksheet(sanitizedName, {
      properties: { defaultColWidth: 35 },
    })
  }

  private async createTitlesSection(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
  ): Promise<void> {
    const epciName = simulation.epcis.find((epci) => epci.code === epciScenario.epciCode)?.name

    epciWorksheet.mergeCells('A1:D1')
    const paramTitleCell = epciWorksheet.getCell('A1')
    CellStyleHelper.applyTitleCell(paramTitleCell)
    paramTitleCell.value = `Rappel du paramétrage pour ${epciName}`

    epciWorksheet.mergeCells('F1:J1')
    const resultTitleCell = epciWorksheet.getCell('F1')
    CellStyleHelper.applyTitleCell(resultTitleCell)
    resultTitleCell.value = `Résultats pour ${epciName}`

    CellStyleHelper.applyCellConfig(epciWorksheet, {
      cell: 'A2',
      value: 'Nom du scénario',
      style: 'sectionHeader',
    })
    CellStyleHelper.applyCellConfig(epciWorksheet, {
      cell: 'B2',
      value: simulation.name,
      style: 'standardBorder',
    })
  }
  private async createParameterSection(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ): Promise<void> {
    await this.createTimeHorizonSection(epciWorksheet, simulation, epciScenario, results)
    await this.createDemographicSection(epciWorksheet, simulation, epciScenario, results)
    await this.createVacantHousingSection(epciWorksheet, simulation, epciScenario, results)
    await this.createSecondaryResidencesSection(epciWorksheet, simulation, epciScenario, results)
    await this.createUrbanRenewalSection(epciWorksheet, epciScenario)
    await this.createBadHousingSection(epciWorksheet, simulation)
  }
  private async createTimeHorizonSection(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ): Promise<void> {
    const headerConfig: SectionConfig = {
      headers: [{ cell: 'D3', value: 'Valeur', style: 'resultHeader' }],
      data: [
        { cell: 'A4', value: 'Horizon de temps', style: 'sectionHeader' },
        { cell: 'A5', value: 'Horizon de projection', style: 'standardBorder' },
        { cell: 'D5', value: simulation.scenario.projection, style: 'standardBorder' },
        { cell: 'A6', value: 'Horizon de résorption du mal-logement', style: 'standardBorder' },
        { cell: 'D6', value: simulation.scenario.b1_horizon_resorption, style: 'standardBorder' },
        { cell: 'A7', value: 'Année du max', style: 'standardBorder' },
        {
          cell: 'D7',
          value: results.flowRequirement.epcis.find((epci) => epci.code === epciScenario.epciCode)?.data.peakYear,
          style: 'standardBorder',
        },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, headerConfig)
  }
  private async createDemographicSection(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ): Promise<void> {
    const demographicPopulationEvolution = await this.demographicEvolutionService.getDemographicEvolutionPopulationByEpci(
      epciScenario.epciCode,
    )
    const demographicPopulationEvolutionEpciData = demographicPopulationEvolution[epciScenario.epciCode]
    const demographicEvolution = await this.demographicEvolutionService.getDemographicEvolution(epciScenario.epciCode)
    const demographicEvolutionEpciData = demographicEvolution[epciScenario.epciCode]
    const populationKey = getPopulationKey(simulation.scenario.b2_scenario)
    const peakYear = results.flowRequirement.epcis.find((epci) => epci.code === epciScenario.epciCode)?.data.peakYear
    // If peakYear < projection, use peakYear and its associated values
    // If peakYear > projection, use projection and its associated values
    const targetYear = peakYear && peakYear < simulation.scenario.projection ? peakYear : simulation.scenario.projection

    const demographicConfig: SectionConfig = {
      data: [
        { cell: 'A9', value: 'Evolution démographique', style: 'sectionHeader' },
        { cell: 'B9', value: 'Modalités', style: 'standardBorder' },
        { cell: 'C9', value: 'Valeur 2021', style: 'standardBorder' },
        { cell: 'D9', value: `Valeur ${targetYear}`, style: 'standardBorder' },
        { cell: 'A10', value: 'Evolution de la population', style: 'standardBorder' },
        { cell: 'B10', value: getPopulationLabel(simulation.scenario.b2_scenario), style: 'standardBorder' },
        {
          cell: 'C10',
          value: (() => {
            const found = demographicPopulationEvolutionEpciData.data.find((d) => d.year === 2021)
            return populationKey ? found?.[populationKey] : 0
          })(),
          style: 'standardBorder',
        },
        {
          cell: 'D10',
          value: (() => {
            const found = demographicPopulationEvolutionEpciData.data.find((d) => d.year === targetYear)
            return populationKey ? found?.[populationKey] : 0
          })(),
          style: 'standardBorder',
        },
        { cell: 'A11', value: 'Evolution des résidences principales', style: 'standardBorder' },
        { cell: 'B11', value: `Décohabitation - ${getMenagesLabel(simulation.scenario.b2_scenario)}`, style: 'standardBorder' },
        {
          cell: 'C11',
          value: (() => {
            const key = getOmphaleKey(simulation.scenario.b2_scenario)
            const found = demographicEvolutionEpciData.data.find((d) => d.year === 2021)
            return key ? found?.[key] : 0
          })(),
          style: 'standardBorder',
        },
        {
          cell: 'D11',
          value: (() => {
            const key = getOmphaleKey(simulation.scenario.b2_scenario)
            const found = demographicEvolutionEpciData.data.find((d) => d.year === targetYear)
            return key ? found?.[key] : 0
          })(),
          style: 'standardBorder',
        },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, demographicConfig)
  }

  private async createVacantHousingSection(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ): Promise<void> {
    const rates = await this.accommodationRatesService.getAccommodationRates(epciScenario.epciCode)
    const peakYear = results.flowRequirement.epcis.find((epci) => epci.code === epciScenario.epciCode)?.data.peakYear
    // If peakYear < projection, use peakYear and its associated values
    // If peakYear > projection, use projection and its associated values
    const targetYear = peakYear && peakYear < simulation.scenario.projection ? peakYear : simulation.scenario.projection

    const vacantHousingConfig: SectionConfig = {
      data: [
        { cell: 'A13', value: 'Logements vacants', style: 'sectionHeader' },
        { cell: 'B13', value: 'Modalités', style: 'standardBorder' },
        { cell: 'C13', value: '%', style: 'standardBorder' },
        { cell: 'D13', value: 'Nombre de logements', style: 'standardBorder' },
        { cell: 'B14', value: 'Vacance globale', style: 'standardBorder' },
        { cell: 'C14', value: this.toPercentage(rates[epciScenario.epciCode].vacancyRate), style: 'standardBorder' },
        { cell: 'B15', value: 'Vacance de courte durée', style: 'standardBorder' },
        { cell: 'C15', value: this.toPercentage(rates[epciScenario.epciCode].shortTermVacancyRate), style: 'standardBorder' },
        { cell: 'B16', value: 'Vacance de longue durée', style: 'standardBorder' },
        { cell: 'C16', value: this.toPercentage(rates[epciScenario.epciCode].longTermVacancyRate), style: 'standardBorder' },
        { cell: 'A18', value: 'Réduction de la part des logements vacants de longue durée', style: 'standardBorder' },
        { cell: 'B19', value: 'Vacance totale', style: 'standardBorder' },
        {
          cell: 'C19',
          value: this.toPercentage(epciScenario.b2_tx_vacance_courte + epciScenario.b2_tx_vacance_longue),
          style: 'standardBorder',
        },
        { cell: 'B20', value: 'Vacance de courte durée', style: 'standardBorder' },
        { cell: 'C20', value: this.toPercentage(epciScenario.b2_tx_vacance_courte), style: 'standardBorder' },
        { cell: 'B21', value: 'Vacance de longue durée', style: 'standardBorder' },
        { cell: 'C21', value: this.toPercentage(epciScenario.b2_tx_vacance_longue), style: 'standardBorder' },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, vacantHousingConfig)

    epciWorksheet.mergeCells('A14:A16')
    const situation2021Cell = epciWorksheet.getCell('A14')
    situation2021Cell.value = 'Situation en 2021'
    situation2021Cell.alignment = { horizontal: 'center', vertical: 'middle' }
    situation2021Cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' },
    }
    CellStyleHelper.applyStandardBorder(situation2021Cell)

    epciWorksheet.mergeCells('A19:A21')
    const situationHorizonCell = epciWorksheet.getCell('A19')
    situationHorizonCell.value = `Situation à ${targetYear}`
    situationHorizonCell.alignment = { horizontal: 'center', vertical: 'middle' }
    situationHorizonCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' },
    }
    CellStyleHelper.applyStandardBorder(situationHorizonCell)
  }

  private async createSecondaryResidencesSection(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ): Promise<void> {
    const rates = await this.accommodationRatesService.getAccommodationRates(epciScenario.epciCode)
    const peakYear = results.flowRequirement.epcis.find((epci) => epci.code === epciScenario.epciCode)?.data.peakYear
    // If peakYear < projection, use peakYear and its associated values
    // If peakYear > projection, use projection and its associated values
    const targetYear = peakYear && peakYear < simulation.scenario.projection ? peakYear : simulation.scenario.projection

    const secondaryResidencesConfig: SectionConfig = {
      data: [
        { cell: 'A23', value: 'Résidences secondaires', style: 'sectionHeader' },
        { cell: 'B23', value: 'Modalités', style: 'standardBorder' },
        { cell: 'C23', value: '%', style: 'standardBorder' },
        { cell: 'D23', value: 'Nombre de logements', style: 'standardBorder' },
        { cell: 'B24', value: 'Résidences secondaires en 2021', style: 'standardBorder' },
        { cell: 'C24', value: this.toPercentage(rates[epciScenario.epciCode].txRs), style: 'standardBorder' },
        { cell: 'B25', value: 'Variation du taux', style: 'standardBorder' },
        { cell: 'C25', value: this.toPercentage(rates[epciScenario.epciCode].txRs - epciScenario.b2_tx_rs), style: 'standardBorder' },
        { cell: 'B26', value: `Résidences secondaires en ${targetYear}`, style: 'standardBorder' },
        { cell: 'C26', value: this.toPercentage(epciScenario.b2_tx_rs), style: 'standardBorder' },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, secondaryResidencesConfig)
  }

  private async createUrbanRenewalSection(epciWorksheet: ExcelJS.Worksheet, epciScenario: TEpciScenario): Promise<void> {
    const rates = await this.accommodationRatesService.getAccommodationRates(epciScenario.epciCode)

    const urbanRenewalConfig: SectionConfig = {
      data: [
        { cell: 'A28', value: 'Renouvellement urbain', style: 'sectionHeader' },
        { cell: 'B28', value: 'Modalités', style: 'standardBorder' },
        { cell: 'C28', value: '%', style: 'standardBorder' },
        { cell: 'D28', value: 'Nombre de logements', style: 'standardBorder' },
        { cell: 'B29', value: 'Taux de restructuration', style: 'standardBorder' },
        { cell: 'C29', value: this.toPercentage(rates[epciScenario.epciCode].restructuringRate), style: 'standardBorder' },
        { cell: 'B30', value: 'Taux de disparition', style: 'standardBorder' },
        { cell: 'C30', value: this.toPercentage(rates[epciScenario.epciCode].disappearanceRate), style: 'standardBorder' },
        { cell: 'B31', value: 'Taux de restructuration', style: 'standardBorder' },
        { cell: 'C31', value: this.toPercentage(epciScenario.b2_tx_restructuration), style: 'standardBorder' },
        { cell: 'B32', value: 'Taux de disparition', style: 'standardBorder' },
        { cell: 'C32', value: this.toPercentage(epciScenario.b2_tx_disparition), style: 'standardBorder' },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, urbanRenewalConfig)

    epciWorksheet.mergeCells('A29:A30')
    const observedRatesCell = epciWorksheet.getCell('A29')
    observedRatesCell.value = 'Taux observés entre 2015 et 2021'
    observedRatesCell.alignment = { horizontal: 'center', vertical: 'middle' }
    observedRatesCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' },
    }
    CellStyleHelper.applyStandardBorder(observedRatesCell)

    epciWorksheet.mergeCells('A31:A32')
    const fixedRatesCell = epciWorksheet.getCell('A31')
    fixedRatesCell.value = 'Taux fixés'
    fixedRatesCell.alignment = { horizontal: 'center', vertical: 'middle' }
    fixedRatesCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' },
    }
    CellStyleHelper.applyStandardBorder(fixedRatesCell)
  }

  private async createBadHousingSection(epciWorksheet: ExcelJS.Worksheet, simulation: TSimulationWithEpciAndScenario): Promise<void> {
    const badHousingConfig: SectionConfig = {
      headers: [
        { cell: 'A34', value: 'Mal-logement', style: 'sectionHeader' },
        { cell: 'B34', value: 'Modalités', style: 'standardBorder' },
        { cell: 'C34', value: 'Part retenue', style: 'standardBorder' },
        { cell: 'D34', value: 'Ménages concernés', style: 'standardBorder' },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, badHousingConfig)

    const malLogementData = [
      {
        row: 35,
        label: `Sans-abri - ${getSource(simulation.scenario.source_b11)}`,
        percentage: `100 %`,
      },
      {
        row: 36,
        label: 'Hébergement social - FINESS',
        percentage: `${simulation.scenario.b11_part_etablissement} %`,
        value: simulation.scenario.b11_etablissement.map((etab: B11Etablissement) => getNoAccommodationLabel(etab)).join(' - '),
      },
      {
        row: 37,
        label: 'Cohabitation intergénérationnelle présumée subie',
        percentage: `${simulation.scenario.b12_cohab_interg_subie} %`,
        value: null,
      },
      {
        row: 38,
        label: 'Hébergés - SNE',
        value: getHostedLabel(simulation.scenario.b12_heberg_temporaire, simulation.scenario.b12_heberg_particulier),
      },
      {
        row: 39,
        label: 'Inadéquation financière - CNAF',
        percentage: `${simulation.scenario.b13_taux_reallocation} %`,
        value: `${getBadHousingCategoryLabel(simulation.scenario.b13_plp, simulation.scenario.b13_acc)} - Taux effort ${simulation.scenario.b13_taux_effort} %`,
      },
      {
        row: 40,
        label: `Mauvaise qualité - ${getSource(simulation.scenario.source_b14, true)}`,
        percentage: `${simulation.scenario.b14_taux_reallocation} %`,
        value: null,
      },
      {
        row: 41,
        label: `Logements suroccupés - ${getSource(simulation.scenario.source_b15, false)}`,
        percentage: `${simulation.scenario.b15_taux_reallocation} %`,
        value: `${getBadHousingCategoryLabel(simulation.scenario.b15_proprietaire, simulation.scenario.b15_loc_hors_hlm)} - Niveau : ${getSurroccLabel(simulation.scenario.b15_surocc)}`,
      },
    ]

    malLogementData.forEach((item) => {
      CellStyleHelper.applyCellConfig(epciWorksheet, {
        cell: `A${item.row}`,
        value: item.label,
        style: 'standardBorder',
      })
      if (item.value) {
        CellStyleHelper.applyCellConfig(epciWorksheet, {
          cell: `B${item.row}`,
          value: item.value,
          style: 'standardBorder',
        })
      }
      if (item.percentage) {
        CellStyleHelper.applyCellConfig(epciWorksheet, {
          cell: `C${item.row}`,
          value: item.percentage,
          style: 'standardBorder',
        })
      }
    })
  }

  private async createResultsSection(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ): Promise<void> {
    await this.createResultsHeaders(epciWorksheet)
    await this.populateMainResults(epciWorksheet, epciScenario, results)
    await this.populateFlowRequirementResults(epciWorksheet, epciScenario, results)
    await this.populateBadHousingResults(epciWorksheet, epciScenario, results, simulation)
    await this.populateFilocomResults(epciWorksheet, epciScenario, simulation)
  }

  private async createResultsHeaders(epciWorksheet: ExcelJS.Worksheet): Promise<void> {
    const headersConfig: SectionConfig = {
      headers: [{ cell: 'G3', value: 'Valeur', style: 'resultHeader' }],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, headersConfig)
  }

  private async populateMainResults(epciWorksheet: ExcelJS.Worksheet, epciScenario: TEpciScenario, results: TResults): Promise<void> {
    const mainResultsConfig: SectionConfig = {
      data: [
        { cell: 'F5', value: 'Besoin total en construction neuves', style: 'sectionHeader' },
        { cell: 'G5', value: results.epcisTotals.find((epci) => epci.epciCode === epciScenario.epciCode)?.total, style: 'importantValue' },
        { cell: 'F6', value: 'Besoin en remobilisation', style: 'sectionHeader' },
        {
          cell: 'G6',
          value: results.epcisTotals.find((epci) => epci.epciCode === epciScenario.epciCode)?.vacantAccomodation,
          style: 'importantValue',
        },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, mainResultsConfig)
  }

  private async populateFlowRequirementResults(
    epciWorksheet: ExcelJS.Worksheet,
    epciScenario: TEpciScenario,
    results: TResults,
  ): Promise<void> {
    const flowSectionConfig: SectionConfig = {
      data: [
        { cell: 'F8', value: "Besoin lié à la démographie et l'évolution du parc", style: 'sectionHeader' },
        { cell: 'F9', value: 'Démographique', style: 'standardBorder' },
        { cell: 'F10', value: 'Logements vacants de court terme', style: 'standardBorder' },
        { cell: 'F11', value: 'Logements vacants de long terme', style: 'standardBorder' },
        { cell: 'F12', value: 'Résidences secondaires', style: 'standardBorder' },
        { cell: 'F13', value: 'Renouvellement urbain (disparition et restructuration)', style: 'standardBorder' },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, flowSectionConfig)

    if (results.flowRequirement) {
      const epciFlowData = results.flowRequirement.epcis.find((epci) => epci.code === epciScenario.epciCode)
      if (epciFlowData) {
        const flowDataConfig: SectionConfig = {
          data: [
            { cell: 'G9', value: epciFlowData.totals.demographicEvolution, style: 'standardBorder' },
            { cell: 'G10', value: epciFlowData.totals.shortTermVacantAccomodation, style: 'standardBorder' },
            { cell: 'G11', value: epciFlowData.totals.longTermVacantAccomodation, style: 'standardBorder' },
            { cell: 'G12', value: epciFlowData.totals.secondaryResidenceAccomodationEvolution, style: 'standardBorder' },
            { cell: 'G13', value: epciFlowData.totals.renewalNeeds, style: 'standardBorder' },
          ],
        }

        CellStyleHelper.applySectionConfig(epciWorksheet, flowDataConfig)
      }
    }
  }

  private async populateBadHousingResults(
    epciWorksheet: ExcelJS.Worksheet,
    epciScenario: TEpciScenario,
    results: TResults,
    simulation: TSimulationWithEpciAndScenario,
  ): Promise<void> {
    const epciTotals = results.epcisTotals.find((epci) => epci.epciCode === epciScenario.epciCode)
    const peakYear = results.flowRequirement.epcis.find((epci) => epci.code === epciScenario.epciCode)?.data.peakYear

    const period = peakYear !== simulation.scenario.projection ? peakYear : simulation.scenario.projection
    const showTotalColumn = peakYear !== simulation.scenario.projection

    const badHousingSectionConfig: SectionConfig = {
      data: [
        { cell: 'F14', value: '', style: 'standardBorder' as CellStyle },
        { cell: 'G14', value: `Sur la période 2021 - ${period}`, style: 'resultHeader' as CellStyle },
        ...(showTotalColumn
          ? [{ cell: 'H14', value: `Sur la période 2021 - ${simulation.scenario.projection}`, style: 'resultHeader' as CellStyle }]
          : []),
        { cell: 'F15', value: 'Besoin lié au mal-logement', style: 'sectionHeader' as CellStyle },
        ...(showTotalColumn
          ? [
              {
                cell: 'H15',
                value: (epciTotals?.prepeakTotalStock || 0) + (epciTotals?.postpeakTotalStock || 0),
                style: 'importantValue' as CellStyle,
              },
            ]
          : []),
        {
          cell: 'G15',
          value: epciTotals?.prepeakTotalStock,
          style: 'importantValue' as CellStyle,
        },
        { cell: 'F16', value: 'Hors logement', style: 'standardBorder' as CellStyle },
        { cell: 'F17', value: 'Hébergement', style: 'standardBorder' as CellStyle },
        { cell: 'F18', value: 'Inadéquation financière', style: 'standardBorder' as CellStyle },
        { cell: 'F19', value: 'Mauvaise qualité', style: 'standardBorder' as CellStyle },
        { cell: 'F20', value: 'Inadéquation physique', style: 'standardBorder' as CellStyle },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, badHousingSectionConfig)

    this.populateBadHousingDetailedResults(epciWorksheet, epciScenario, results, simulation)
  }

  private populateBadHousingDetailedResults(
    epciWorksheet: ExcelJS.Worksheet,
    epciScenario: TEpciScenario,
    results: TResults,
    simulation: TSimulationWithEpciAndScenario,
  ): void {
    const peakYear = results.flowRequirement.epcis.find((epci) => epci.code === epciScenario.epciCode)?.data.peakYear
    const showTotalColumn = peakYear !== simulation.scenario.projection

    const resultCategories = [
      { key: 'noAccomodation', row: 16 },
      { key: 'hosted', row: 17 },
      { key: 'financialInadequation', row: 18 },
      { key: 'badQuality', row: 19 },
      { key: 'physicalInadequation', row: 20 },
    ]
    resultCategories.forEach(({ key, row }) => {
      const epciData = results[key].epcis.find((epci) => epci.epciCode === epciScenario.epciCode)

      if (epciData) {
        CellStyleHelper.applyCellConfig(epciWorksheet, {
          cell: `G${row}`,
          value: epciData.prorataValue,
          style: 'standardBorder',
        })

        if (showTotalColumn) {
          CellStyleHelper.applyCellConfig(epciWorksheet, {
            cell: `H${row}`,
            value: epciData.value,
            style: 'standardBorder',
          })
        }
      }
    })
  }

  private async populateFilocomResults(
    epciWorksheet: ExcelJS.Worksheet,
    epciScenario: TEpciScenario,
    simulation: TSimulationWithEpciAndScenario,
  ): Promise<void> {
    const filocomData = await this.prismaService.filocomFlux.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const homelessData = await this.prismaService.homeless.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const hostedFinessData = await this.prismaService.hostedFiness.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const hostedFilocomData = await this.prismaService.hostedFilocom.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const financialInadequationData = await this.prismaService.financialInadequation.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const badQualityFilocomData = await this.prismaService.badQuality_Filocom.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const badQualityFonciersData = await this.prismaService.badQuality_Fonciers.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const badQualityRPData = await this.prismaService.badQuality_RP.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const physicalInadequationFiloData = await this.prismaService.physicalInadequation_Filo.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    const physicalInadequationRPData = await this.prismaService.physicalInadequation_RP.findUnique({
      where: { epciCode: epciScenario.epciCode },
    })

    if (!filocomData) {
      return
    }

    // Get percentage values from column C to calculate the number of logements
    const vacancyGlobalPercent = parseFloat(epciWorksheet.getCell('C14').value?.toString() || '0') / 100
    const vacancyShortTermPercent = parseFloat(epciWorksheet.getCell('C15').value?.toString() || '0') / 100
    const vacancyLongTermPercent = parseFloat(epciWorksheet.getCell('C16').value?.toString() || '0') / 100

    const vacancyTotalPercentHorizon = parseFloat(epciWorksheet.getCell('C19').value?.toString() || '0') / 100
    const vacancyShortTermPercentHorizon = parseFloat(epciWorksheet.getCell('C20').value?.toString() || '0') / 100
    const vacancyLongTermPercentHorizon = parseFloat(epciWorksheet.getCell('C21').value?.toString() || '0') / 100

    // Get secondary residences percentage values from column C (rows 24-26)
    const secondaryResidences2021Percent = parseFloat(epciWorksheet.getCell('C24').value?.toString() || '0') / 100
    const secondaryResidencesVariationPercent = parseFloat(epciWorksheet.getCell('C25').value?.toString() || '0') / 100
    const secondaryResidencesProjectionPercent = parseFloat(epciWorksheet.getCell('C26').value?.toString() || '0') / 100

    // Get urban renewal percentage values from column C (rows 29-32)
    const restructuringRateObservedPercent = parseFloat(epciWorksheet.getCell('C29').value?.toString() || '0') / 100
    const disappearanceRateObservedPercent = parseFloat(epciWorksheet.getCell('C30').value?.toString() || '0') / 100
    const restructuringRateFixedPercent = parseFloat(epciWorksheet.getCell('C31').value?.toString() || '0') / 100
    const disappearanceRateFixedPercent = parseFloat(epciWorksheet.getCell('C32').value?.toString() || '0') / 100

    // Calculate number of logements for 2021 situation (rows 14-16)
    const config2021: SectionConfig = {
      data: [
        {
          cell: 'D14',
          value: Math.round(filocomData.parctot * vacancyGlobalPercent),
          style: 'standardBorder',
        },
        {
          cell: 'D15',
          value: Math.round(filocomData.parctot * vacancyShortTermPercent),
          style: 'standardBorder',
        },
        {
          cell: 'D16',
          value: Math.round(filocomData.parctot * vacancyLongTermPercent),
          style: 'standardBorder',
        },
      ],
    }

    // Calculate number of logements for projection horizon (rows 19-21)
    const configHorizon: SectionConfig = {
      data: [
        {
          cell: 'D19',
          value: Math.round(filocomData.parctot * vacancyTotalPercentHorizon),
          style: 'standardBorder',
        },
        {
          cell: 'D20',
          value: Math.round(filocomData.parctot * vacancyShortTermPercentHorizon),
          style: 'standardBorder',
        },
        {
          cell: 'D21',
          value: Math.round(filocomData.parctot * vacancyLongTermPercentHorizon),
          style: 'standardBorder',
        },
      ],
    }

    // Calculate number of logements for secondary residences (rows 24-26)
    const configSecondaryResidences: SectionConfig = {
      data: [
        {
          cell: 'D24',
          value: Math.round(filocomData.parctot * secondaryResidences2021Percent),
          style: 'standardBorder',
        },
        {
          cell: 'D25',
          value: Math.round(filocomData.parctot * secondaryResidencesVariationPercent),
          style: 'standardBorder',
        },
        {
          cell: 'D26',
          value: Math.round(filocomData.parctot * secondaryResidencesProjectionPercent),
          style: 'standardBorder',
        },
      ],
    }

    // Calculate number of logements for urban renewal (rows 29-32)
    const configUrbanRenewal: SectionConfig = {
      data: [
        {
          cell: 'D29',
          value: Math.round(filocomData.parctot * restructuringRateObservedPercent),
          style: 'standardBorder',
        },
        {
          cell: 'D30',
          value: Math.round(filocomData.parctot * disappearanceRateObservedPercent),
          style: 'standardBorder',
        },
        {
          cell: 'D31',
          value: Math.round(filocomData.parctot * restructuringRateFixedPercent),
          style: 'standardBorder',
        },
        {
          cell: 'D32',
          value: Math.round(filocomData.parctot * disappearanceRateFixedPercent),
          style: 'standardBorder',
        },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, config2021)
    CellStyleHelper.applySectionConfig(epciWorksheet, configHorizon)
    CellStyleHelper.applySectionConfig(epciWorksheet, configSecondaryResidences)
    CellStyleHelper.applySectionConfig(epciWorksheet, configUrbanRenewal)

    // Calculate homeless data for D35 based on source_b11
    if (homelessData) {
      const homelessPercent = parseFloat(epciWorksheet.getCell('C35').value?.toString() || '0') / 100
      const homelessValue = simulation.scenario.source_b11 === 'RP' ? homelessData.rp : homelessData.sne

      const configHomeless: SectionConfig = {
        data: [
          {
            cell: 'D35',
            value: Math.round(homelessValue * homelessPercent),
            style: 'standardBorder',
          },
        ],
      }

      CellStyleHelper.applySectionConfig(epciWorksheet, configHomeless)
    }

    // Calculate hosted FINESS data for D36 based on b11_etablissement
    if (hostedFinessData) {
      const hostedFinessPercent = parseFloat(epciWorksheet.getCell('C36').value?.toString() || '0') / 100

      // Sum values from hosted_finess table based on b11_etablissement array
      const totalHostedValue = simulation.scenario.b11_etablissement.reduce((sum, etablissement) => {
        const fieldValue = hostedFinessData[etablissement as keyof typeof hostedFinessData] as number
        return sum + (fieldValue || 0)
      }, 0)

      const configHostedFiness: SectionConfig = {
        data: [
          {
            cell: 'D36',
            value: Math.round(totalHostedValue * hostedFinessPercent),
            style: 'standardBorder',
          },
        ],
      }

      CellStyleHelper.applySectionConfig(epciWorksheet, configHostedFiness)
    }

    // Calculate hosted Filocom data for D37 based on b12_cohab_interg_subie
    if (hostedFilocomData) {
      const configHostedFilocom: SectionConfig = {
        data: [
          {
            cell: 'D38',
            value: Math.round(hostedFilocomData.value),
            style: 'standardBorder',
          },
        ],
      }

      CellStyleHelper.applySectionConfig(epciWorksheet, configHostedFilocom)
    }

    // Calculate financial inadequation data for D39 based on b13_acc, b13_plp, and b13_taux_effort
    if (financialInadequationData) {
      const financialInadequationPercent = parseFloat(epciWorksheet.getCell('C39').value?.toString() || '0') / 100

      let totalFinancialValue = 0

      // Add AccessionPropriete value if b13_acc is true
      if (simulation.scenario.b13_acc) {
        const accessionFieldName =
          `nbAllPlus${simulation.scenario.b13_taux_effort}AccessionPropriete` as keyof typeof financialInadequationData
        const accessionValue = financialInadequationData[accessionFieldName] as number
        totalFinancialValue += accessionValue || 0
      }

      // Add ParcLocatifPrive value if b13_plp is true
      if (simulation.scenario.b13_plp) {
        const parcLocatifFieldName =
          `nbAllPlus${simulation.scenario.b13_taux_effort}ParcLocatifPrive` as keyof typeof financialInadequationData
        const parcLocatifValue = financialInadequationData[parcLocatifFieldName] as number
        totalFinancialValue += parcLocatifValue || 0
      }

      const configFinancialInadequation: SectionConfig = {
        data: [
          {
            cell: 'D39',
            value: Math.round(totalFinancialValue * financialInadequationPercent),
            style: 'standardBorder',
          },
        ],
      }

      CellStyleHelper.applySectionConfig(epciWorksheet, configFinancialInadequation)
    }

    // Calculate bad quality data for D40 based on source_b14
    const badQualityPercent = parseFloat(epciWorksheet.getCell('C40').value?.toString() || '0') / 100
    let totalBadQualityValue = 0

    switch (simulation.scenario.source_b14) {
      case 'RP':
        if (badQualityRPData) {
          totalBadQualityValue =
            (badQualityRPData.saniLocNonhlm || 0) +
            (badQualityRPData.saniPpT || 0) +
            (badQualityRPData.saniChflLocNonhlm || 0) +
            (badQualityRPData.saniChflPpT || 0)
        }
        break
      case 'Filo':
        if (badQualityFilocomData) {
          totalBadQualityValue = (badQualityFilocomData.pppiLp || 0) + (badQualityFilocomData.pppiPo || 0)
        }
        break
      case 'FF':
        if (badQualityFonciersData) {
          // Sum all fields from BadQuality_Fonciers
          totalBadQualityValue = Object.values(badQualityFonciersData)
            .filter((value): value is number => typeof value === 'number')
            .reduce((sum, value) => sum + value, 0)
        }
        break
    }

    if (totalBadQualityValue > 0) {
      const configBadQuality: SectionConfig = {
        data: [
          {
            cell: 'D40',
            value: Math.round(totalBadQualityValue * badQualityPercent),
            style: 'standardBorder',
          },
        ],
      }

      CellStyleHelper.applySectionConfig(epciWorksheet, configBadQuality)
    }

    const physicalInadequationPercent = parseFloat(epciWorksheet.getCell('C41').value?.toString() || '0') / 100
    let totalPhysicalValue = 0

    if (simulation.scenario.source_b15 === 'Filo' && physicalInadequationFiloData) {
      const surocc = simulation.scenario.b15_surocc === 'Mod' ? 'Leg' : 'Lourde'

      const values = [
        simulation.scenario.b15_proprietaire
          ? (physicalInadequationFiloData[`surocc${surocc}Po` as keyof typeof physicalInadequationFiloData] as number)
          : 0,
        simulation.scenario.b15_loc_hors_hlm
          ? (physicalInadequationFiloData[`surocc${surocc}Lp` as keyof typeof physicalInadequationFiloData] as number)
          : 0,
      ]

      totalPhysicalValue = values.reduce((sum, value) => sum + (value || 0), 0)
    } else if (simulation.scenario.source_b15 === 'RP' && physicalInadequationRPData) {
      const surocc = simulation.scenario.b15_surocc

      const values = [
        simulation.scenario.b15_proprietaire
          ? (physicalInadequationRPData[`nbMen${surocc}PpT` as keyof typeof physicalInadequationRPData] as number)
          : 0,
        simulation.scenario.b15_loc_hors_hlm
          ? (physicalInadequationRPData[`nbMen${surocc}LocNonHLM` as keyof typeof physicalInadequationRPData] as number)
          : 0,
      ]

      totalPhysicalValue = values.reduce((sum, value) => sum + (value || 0), 0)
    }

    if (totalPhysicalValue > 0) {
      const configPhysicalInadequation: SectionConfig = {
        data: [
          {
            cell: 'D41',
            value: Math.round(totalPhysicalValue * physicalInadequationPercent),
            style: 'standardBorder',
          },
        ],
      }

      CellStyleHelper.applySectionConfig(epciWorksheet, configPhysicalInadequation)
    }
  }

  private async createAnnualizedNeedsSection(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ): Promise<void> {
    const annualizedNeedsConfig: SectionConfig = {
      data: [
        { cell: 'F22', value: `Besoin en logements annualisé (jusqu'à horizon de projection)`, style: 'sectionHeader' },
        { cell: 'F23', value: 'Année', style: 'standardBorder' },
        { cell: 'F24', value: 'Permis de construire autorisés (Sit@del)', style: 'standardBorder' },
        { cell: 'F25', value: 'Logements commencés (Sit@del)', style: 'standardBorder' },
        { cell: 'F26', value: 'Besoins en constructions neuves', style: 'standardBorder' },
        { cell: 'F27', value: 'Logements excédentaires', style: 'standardBorder' },
      ],
    }

    CellStyleHelper.applySectionConfig(epciWorksheet, annualizedNeedsConfig)

    const explanationCell = epciWorksheet.getCell('O21')
    explanationCell.value =
      '2021 : point de départ des projections de besoins en logements. Les années représentées dans la ligne ci-dessous donne le nombre de logements autorisés, le nombre de logements commencés, ainsi que le besoin en logements total sur une année entière (du 1er Janvier au 31 Décembre).'
    explanationCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
    explanationCell.font = { size: 10 }
    epciWorksheet.mergeCells('O21:W21')

    this.populateAnnualData(epciWorksheet, simulation, epciScenario, results)
  }

  private populateAnnualData(
    epciWorksheet: ExcelJS.Worksheet,
    simulation: TSimulationWithEpciAndScenario,
    epciScenario: TEpciScenario,
    results: TResults,
  ): void {
    let col = 7
    for (let year = 2013; year <= simulation.scenario.projection; year++) {
      const cell = epciWorksheet.getCell(23, col)
      CellStyleHelper.applyCellConfig(epciWorksheet, {
        cell: cell.address,
        value: year,
        style: 'standardBorder',
      })
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E7E6E6' },
      }
      epciWorksheet.getColumn(col).width = 15
      col++
    }

    const dataRows = [
      { row: 24, results: results.sitadel, dataKey: 'authorizedHousingCount' },
      { row: 25, results: results.sitadel, dataKey: 'startedHousingCount' },
      { row: 26, results: results.flowRequirement, dataKey: 'housingNeeds' },
      { row: 27, results: results.flowRequirement, dataKey: 'surplusHousing' },
    ]

    dataRows.forEach(({ row, results: resultData, dataKey }) => {
      if (resultData) {
        const epciData = resultData.epcis.find((epci) => epci.code === epciScenario.epciCode)
        if (epciData) {
          let dataCol = 7
          for (let year = 2013; year <= simulation.scenario.projection; year++) {
            let cellValue = 0
            if (dataKey === 'authorizedHousingCount' || dataKey === 'startedHousingCount') {
              const series = epciData.data as Array<{ authorizedHousingCount: number; startedHousingCount: number; year: number }>
              const found = Array.isArray(series) ? series.find((d) => d.year === year) : undefined
              cellValue = found ? found[dataKey] : 0
            } else {
              const container = epciData.data as unknown as { [k: string]: Record<number, number> | undefined }
              const group = container[dataKey]
              cellValue = group && typeof group[year] === 'number' ? group[year] : 0
            }

            CellStyleHelper.applyCellConfig(epciWorksheet, {
              cell: epciWorksheet.getCell(row, dataCol).address,
              value: cellValue,
              style: 'standardBorder',
            })
            dataCol++
          }
        }
      }
    })
  }

  private applyFinalStyling(epciWorksheet: ExcelJS.Worksheet): void {
    this.applySectionHeaderStyles(epciWorksheet)
    this.applyAlternateRowColors(epciWorksheet)
    this.addSeparatorColumn(epciWorksheet)
    this.setRowHeights(epciWorksheet)
  }

  private applySectionHeaderStyles(epciWorksheet: ExcelJS.Worksheet): void {
    const sectionHeaderCells = ['B9', 'C9', 'D9', 'B13', 'C13', 'D13', 'B23', 'C23', 'D23', 'B28', 'C28', 'D28', 'B34', 'C34', 'D34']
    sectionHeaderCells.forEach((cellAddr) => {
      const cell = epciWorksheet.getCell(cellAddr)
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E7E6E6' },
      }
    })
  }

  private applyAlternateRowColors(epciWorksheet: ExcelJS.Worksheet): void {
    const alternateRowColors = [
      { rows: [14, 15, 16], color: 'F8F8F8' },
      { rows: [19, 20, 21], color: 'F8F8F8' },
      { rows: [23, 24, 25], color: 'F8F8F8' },
      { rows: [29, 30], color: 'F8F8F8' },
      { rows: [31, 32], color: 'F8F8F8' },
      { rows: [35, 36, 37, 38, 39, 40, 41], color: 'F8F8F8' },
      { rows: [9, 10, 11, 12, 13], color: 'F8F8F8' },
      { rows: [16, 17, 18, 19, 20, 20], color: 'F8F8F8' },
      { rows: [24, 25, 26], color: 'F8F8F8' },
    ]

    alternateRowColors.forEach((section) => {
      section.rows.forEach((rowNum, index) => {
        if (index % 2 === 1) {
          for (let col = 1; col <= 10; col++) {
            const cell = epciWorksheet.getCell(rowNum, col)
            const isPatternFill = (fill: ExcelJS.Fill | undefined): fill is ExcelJS.FillPattern => !!fill && fill.type === 'pattern'
            const fill = cell.fill
            const isBlueHeader =
              isPatternFill(fill) &&
              typeof fill.fgColor?.argb === 'string' &&
              (fill.fgColor.argb.includes('BDD7EE') || fill.fgColor.argb.includes('4472C4'))
            const isYellowImportantCell =
              isPatternFill(fill) && typeof fill.fgColor?.argb === 'string' && fill.fgColor.argb.includes('FFFF99')
            if (cell.value && !isBlueHeader && !isYellowImportantCell) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: section.color },
              }
            }
          }
        }
      })
    })
  }

  private addSeparatorColumn(epciWorksheet: ExcelJS.Worksheet): void {
    for (let row = 1; row <= 45; row++) {
      const separatorCell = epciWorksheet.getCell(row, 5)
      if (row === 1) {
        separatorCell.border = {}
      } else {
        separatorCell.border = {
          left: { style: 'medium', color: { argb: '000000' } },
          right: { style: 'medium', color: { argb: '000000' } },
        }
      }
    }
  }

  private setColumnWidths(epciWorksheet: ExcelJS.Worksheet): void {
    const columnWidths = {
      A: 65,
      B: 40,
      C: 15,
      D: 20,
      E: 5,
      F: 50,
      G: 25,
      H: 25,
      I: 15,
      J: 15,
      K: 15,
      L: 15,
      M: 15,
      N: 15,
      O: 25,
      P: 25,
      Q: 25,
      R: 25,
      S: 25,
      T: 25,
    }

    Object.entries(columnWidths).forEach(([column, width]) => {
      epciWorksheet.getColumn(column).width = width
    })
  }

  private setRowHeights(epciWorksheet: ExcelJS.Worksheet): void {
    epciWorksheet.getRow(1).height = 25
    epciWorksheet.getRow(2).height = 20
  }

  async exportScenario(simulationId: string) {
    const workbook = new ExcelJS.Workbook()

    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: { epcis: true, scenario: { include: { epciScenarios: true } } },
      where: { id: simulationId },
    })

    const resultsData = await this.resultsService.getResults(simulationId)

    await this.createSyntheseSheet(workbook, simulation as TSimulationWithEpciAndScenario, resultsData.results)

    for (const epciScenario of simulation.scenario.epciScenarios) {
      await this.createEpciSheet(workbook, simulation as TSimulationWithEpciAndScenario, epciScenario, resultsData.results)
    }

    return { simulation, workbook }
  }

  async markAsExported(simulationId: string) {
    return this.prismaService.export.create({
      data: {
        type: 'EXCEL',
        simulationId,
      },
    })
  }
}
