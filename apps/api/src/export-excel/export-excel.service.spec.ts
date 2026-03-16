import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import * as ExcelJS from 'exceljs'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { ResultsService } from '~/results/results.service'
import { TResults } from '~/schemas/results/results'
import { ExportExcelService } from './export-excel.service'

const EPCI_CODE = '200000001'

const makeSimulationData = () => ({
  id: 'sim-1',
  name: 'Test Simulation',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  epcis: [{ code: EPCI_CODE, name: 'Test EPCI', bassinName: null }],
  scenario: {
    id: 'scenario-1',
    b11_etablissement: ['autreCentre'],
    b11_fortune: true,
    b11_hotel: true,
    b11_part_etablissement: 50,
    b11_sa: true,
    b12_cohab_interg_subie: 50,
    b12_heberg_particulier: true,
    b12_heberg_temporaire: true,
    b13_acc: true,
    b13_plp: true,
    b13_taux_effort: 30,
    b13_taux_reallocation: 10,
    b14_confort: 'RP_abs_sani',
    b14_occupation: 'loc',
    b14_qualite: 'FF_Ind',
    b14_taux_reallocation: 10,
    b15_loc_hors_hlm: true,
    b15_proprietaire: true,
    b15_surocc: 'Mod',
    b15_taux_reallocation: 10,
    b17_motif: 'Tout',
    b1_horizon_resorption: 2041,
    b2_scenario: 'Central_B',
    epciScenarios: [
      {
        epciCode: EPCI_CODE,
        b2_tx_disparition: 0.005,
        b2_tx_restructuration: 0.002,
        b2_tx_rs: 0.05,
        b2_tx_vacance: 0.08,
        b2_tx_vacance_longue: 0.04,
        b2_tx_vacance_courte: 0.04,
        baseEpci: true,
      },
    ],
    isConfidential: false,
    projection: 2041,
    millesime: '2021',
    source_b11: 'RP',
    source_b14: 'RP',
    source_b15: 'RP',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
})

const makeResults = (): TResults => ({
  epcisTotals: [
    {
      epciCode: EPCI_CODE,
      total: 1500,
      totalFlux: 800,
      totalStock: 650,
      vacantAccomodation: 50,
      secondaryAccommodation: 50,
      prepeakTotalStock: 500,
      postpeakTotalStock: 150,
    },
  ],
  flowRequirement: {
    epcis: [
      {
        code: EPCI_CODE,
        data: {
          parcEvolution: { '2021': 0, '2041': 100 },
          housingNeeds: { '2021': 0, '2041': 75 },
          surplusHousing: { '2021': 0, '2041': 25 },
          peakYear: 2035,
        },
        totals: {
          demographicEvolution: 400,
          renewalNeeds: 100,
          secondaryResidenceAccomodationEvolution: 150,
          surplusHousing: 50,
          housingNeeds: 200,
          vacantAccomodation: 50,
          shortTermVacantAccomodation: 30,
          longTermVacantAccomodation: 20,
        },
        metadata: { max: 500, min: 0 },
      },
    ],
  },
  sitadel: {
    epcis: [
      {
        code: EPCI_CODE,
        data: [{ year: 2021, authorizedHousingCount: 120, startedHousingCount: 100 }],
        metadata: { max: 200, min: 0 },
      },
    ],
  },
  noAccomodation: {
    epcis: [{ epciCode: EPCI_CODE, value: 100, prorataValue: 75 }],
    total: 100,
    prorataTotal: 75,
  },
  hosted: {
    epcis: [{ epciCode: EPCI_CODE, value: 200, prorataValue: 150 }],
    total: 200,
    prorataTotal: 150,
  },
  financialInadequation: {
    epcis: [{ epciCode: EPCI_CODE, value: 150, prorataValue: 110 }],
    total: 150,
    prorataTotal: 110,
  },
  badQuality: {
    epcis: [{ epciCode: EPCI_CODE, value: 80, prorataValue: 60 }],
    total: 80,
    prorataTotal: 60,
  },
  physicalInadequation: {
    epcis: [{ epciCode: EPCI_CODE, value: 120, prorataValue: 90 }],
    total: 120,
    prorataTotal: 90,
  },
  total: 1500,
  totalFlux: 800,
  totalStock: 650,
  vacantAccomodation: 50,
  secondaryAccommodation: 150,
})

const makeAccommodationRates = () => ({
  [EPCI_CODE]: {
    vacancyRate: 0.08,
    longTermVacancyRate: 0.04,
    shortTermVacancyRate: 0.04,
    txRs: 0.06,
    urbanRenewal: 100000,
    vacancy: { nbAccommodation: 5000, year: 2021 },
    restructuringRate: 0.002,
    disappearanceRate: 0.005,
    totalVacantCount: 8000,
    longTermVacantCount: 4000,
  },
})

// b2_scenario = 'Central_B' → getPopulationKey = 'central', getOmphaleKey = 'centralB'
const RP_PROJ = 130000 // D11 value (ménages at peakYear 2035)

const makeDemographicPopulation = () => ({
  [EPCI_CODE]: {
    data: [
      { year: 2021, central: 250000, haute: 260000, basse: 240000 },
      { year: 2035, central: 270000, haute: 280000, basse: 260000 },
    ],
    metadata: { max: 280000, min: 240000 },
  },
})

const makeDemographicMenages = () => ({
  [EPCI_CODE]: {
    data: [
      { year: 2021, centralB: 120000, centralC: 0, centralH: 0, phB: 0, phC: 0, phH: 0, pbB: 0, pbC: 0, pbH: 0 },
      { year: 2035, centralB: RP_PROJ, centralC: 0, centralH: 0, phB: 0, phC: 0, phH: 0, pbB: 0, pbC: 0, pbH: 0 },
    ],
    metadata: { max: RP_PROJ, min: 120000 },
  },
})

const PARCTOT = 100000

const makeFilocomFlux = () => ({
  epciCode: EPCI_CODE,
  parctot: PARCTOT,
  txLvParctot: 0.08,
  txRsParctot: 0.06,
})

describe('ExportExcelService', () => {
  let service: ExportExcelService
  let prisma: DeepMocked<PrismaService>
  let resultsService: DeepMocked<ResultsService>
  let accommodationRatesService: DeepMocked<AccommodationRatesService>
  let demographicEvolutionService: DeepMocked<DemographicEvolutionService>

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    resultsService = createMock<ResultsService>()
    accommodationRatesService = createMock<AccommodationRatesService>()
    demographicEvolutionService = createMock<DemographicEvolutionService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportExcelService,
        { provide: PrismaService, useValue: prisma },
        { provide: ResultsService, useValue: resultsService },
        { provide: AccommodationRatesService, useValue: accommodationRatesService },
        { provide: DemographicEvolutionService, useValue: demographicEvolutionService },
      ],
    }).compile()

    service = module.get<ExportExcelService>(ExportExcelService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('exportScenario - data integrity', () => {
    let workbook: ExcelJS.Workbook
    let syntheseSheet: ExcelJS.Worksheet
    let epciSheet: ExcelJS.Worksheet

    const results = makeResults()
    const epciTotals = results.epcisTotals[0]
    const flowEpci = results.flowRequirement.epcis[0]

    beforeEach(async () => {
      const simulation = makeSimulationData()

      prisma.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(simulation as any)
      resultsService.getResults.mockResolvedValue({ ...simulation, results } as any)
      accommodationRatesService.getAccommodationRates.mockResolvedValue(makeAccommodationRates() as any)
      demographicEvolutionService.getDemographicEvolutionPopulationByEpci.mockResolvedValue(makeDemographicPopulation() as any)
      demographicEvolutionService.getDemographicEvolution.mockResolvedValue(makeDemographicMenages() as any)

      prisma.filocomFlux.findUnique = jest.fn().mockResolvedValue(makeFilocomFlux() as any)
      prisma.hostedFiness.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, autreCentre: 200 } as any)
      prisma.hostedFilocom.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, value: 800 } as any)
      prisma.hostedSne.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, particular: 50, temporary: 30 } as any)
      prisma.financialInadequation.findUnique = jest.fn().mockResolvedValue({
        epciCode: EPCI_CODE,
        nbAllPlus30AccessionPropriete: 300,
        nbAllPlus30ParcLocatifPrive: 400,
      } as any)
      prisma.badQuality_RP.findUnique = jest.fn().mockResolvedValue({
        epciCode: EPCI_CODE,
        saniLocNonhlm: 100,
        saniPpT: 150,
        saniChflLocNonhlm: 50,
        saniChflPpT: 75,
      } as any)
      prisma.badQuality_Filocom.findUnique = jest.fn().mockResolvedValue(null)
      prisma.badQuality_Fonciers.findUnique = jest.fn().mockResolvedValue(null)
      prisma.physicalInadequation_RP.findUnique = jest.fn().mockResolvedValue({
        epciCode: EPCI_CODE,
        nbMenModPpt: 60,
        nbMenModLocNonHLM: 45,
      } as any)
      prisma.physicalInadequation_Filo.findUnique = jest.fn().mockResolvedValue(null)
      prisma.homeless.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, rp: 500, sne: 400 } as any)
      prisma.hotel.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, rp: 150, sne: 120 } as any)
      prisma.makeShiftHousing_RP.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, value: 80 } as any)
      prisma.makeShiftHousing_SNE.findUnique = jest.fn().mockResolvedValue(null)

      const result = await service.exportScenario('sim-1')
      workbook = result.workbook

      syntheseSheet = workbook.getWorksheet('Ensemble des EPCI')!
      epciSheet = workbook.worksheets[1]
    })

    describe('synthesis sheet', () => {
      it('should write EPCI totals from results', () => {
        const row = syntheseSheet.getRow(7)
        expect(row.getCell(1).value).toBe(EPCI_CODE)
        expect(row.getCell(2).value).toBe('Test EPCI')
        expect(row.getCell(3).value).toBe(epciTotals.totalFlux)
        // peakYear (2035) > 2021 → uses prepeakTotalStock
        expect(row.getCell(4).value).toBe(epciTotals.prepeakTotalStock)
        expect(row.getCell(5).value).toBe(epciTotals.totalFlux + epciTotals.prepeakTotalStock)
        expect(row.getCell(6).value).toBe(epciTotals.vacantAccomodation)
        // projection (2041) > peakYear (2035) → display peakYear
        expect(row.getCell(7).value).toBe(flowEpci.data.peakYear)
      })

      it('should write correct totals row', () => {
        const totalRow = syntheseSheet.getRow(8)
        expect(totalRow.getCell(1).value).toBe('Ensemble des EPCI')
        expect(totalRow.getCell(3).value).toBe(epciTotals.totalFlux)
        expect(totalRow.getCell(4).value).toBe(epciTotals.totalStock)
        expect(totalRow.getCell(5).value).toBe(epciTotals.totalFlux + epciTotals.totalStock)
        expect(totalRow.getCell(6).value).toBe(epciTotals.vacantAccomodation)
      })
    })

    describe('EPCI sheet - main results', () => {
      it('should write total housing needs from results.epcisTotals', () => {
        expect(epciSheet.getCell('G5').value).toBe(epciTotals.total)
      })

      it('should write vacant accommodation needs from results.epcisTotals', () => {
        expect(epciSheet.getCell('G6').value).toBe(epciTotals.vacantAccomodation)
      })
    })

    describe('EPCI sheet - flow requirement results', () => {
      it('should write demographic evolution from flow totals', () => {
        expect(epciSheet.getCell('G9').value).toBe(flowEpci.totals.demographicEvolution)
      })

      it('should write short-term vacant accommodation from flow totals', () => {
        expect(epciSheet.getCell('G10').value).toBe(flowEpci.totals.shortTermVacantAccomodation)
      })

      it('should write long-term vacant accommodation from flow totals', () => {
        expect(epciSheet.getCell('G11').value).toBe(flowEpci.totals.longTermVacantAccomodation)
      })

      it('should write secondary residence evolution from flow totals', () => {
        expect(epciSheet.getCell('G12').value).toBe(flowEpci.totals.secondaryResidenceAccomodationEvolution)
      })

      it('should write renewal needs from flow totals', () => {
        expect(epciSheet.getCell('G13').value).toBe(flowEpci.totals.renewalNeeds)
      })
    })

    describe('EPCI sheet - bad housing stock results', () => {
      it('should write pre-peak total stock in G15', () => {
        expect(epciSheet.getCell('G15').value).toBe(epciTotals.prepeakTotalStock)
      })

      it('should write full total stock in H15 when peakYear differs from projection', () => {
        expect(epciSheet.getCell('H15').value).toBe(epciTotals.prepeakTotalStock + epciTotals.postpeakTotalStock)
      })

      it.each([
        ['noAccomodation', 16],
        ['hosted', 17],
        ['financialInadequation', 18],
        ['badQuality', 19],
        ['physicalInadequation', 20],
      ] as const)('should write %s prorataValue to G%d and value to H%d', (key, row) => {
        const epciData = results[key].epcis[0]
        expect(epciSheet.getCell(`G${row}`).value).toBe(epciData.prorataValue)
        expect(epciSheet.getCell(`H${row}`).value).toBe(epciData.value)
      })
    })

    describe('EPCI sheet - projected housing stock (parctotProj)', () => {
      // parctotProj = RP_proj / (1 - b2_tx_rs - b2_tx_vacance_longue - b2_tx_vacance_courte)
      //             = 130000 / (1 - 0.05 - 0.04 - 0.04) = 130000 / 0.87
      const txRpProj = 1 - 0.05 - 0.04 - 0.04 // 0.87
      const parctotProj = RP_PROJ / txRpProj

      it('should compute D19-D21 from millesime values + flow besoin', () => {
        // D15 = PARCTOT * shortTermVacancyRate = 100000 * 0.04 = 4000
        // D16 = PARCTOT * longTermVacancyRate = 100000 * 0.04 = 4000
        // G10 (shortTermBesoin) = 30, G11 (longTermBesoin) = 20
        const d15 = Math.round(PARCTOT * 0.04)
        const d16 = Math.round(PARCTOT * 0.04)
        const d20 = d15 + flowEpci.totals.shortTermVacantAccomodation // 4000 + 30
        const d21 = d16 + flowEpci.totals.longTermVacantAccomodation // 4000 + 20
        expect(epciSheet.getCell('D20').value).toBe(d20)
        expect(epciSheet.getCell('D21').value).toBe(d21)
        expect(epciSheet.getCell('D19').value).toBe(d20 + d21)
      })

      it('should use parctotProj for D26 (secondary residences projection)', () => {
        expect(epciSheet.getCell('D26').value).toBe(Math.round(parctotProj * 0.05))
      })

      it('should still use filocom parctot for 2021 rows (D14-D16)', () => {
        expect(epciSheet.getCell('D14').value).toBe(Math.round(PARCTOT * 0.08))
        expect(epciSheet.getCell('D15').value).toBe(Math.round(PARCTOT * 0.04))
        expect(epciSheet.getCell('D16').value).toBe(Math.round(PARCTOT * 0.04))
      })

      it('should still use filocom parctot for D24 (RS 2021) and D25 = D26 - D24', () => {
        expect(epciSheet.getCell('D24').value).toBe(Math.round(PARCTOT * 0.06))
        expect(epciSheet.getCell('D25').value).toBe(
          Math.round(parctotProj * 0.05) - Math.round(PARCTOT * 0.06),
        )
      })
    })

    describe('EPCI sheet - mal-logement headers', () => {
      it('should have C34 as "Ménages concernés en 2021"', () => {
        expect(epciSheet.getCell('C34').value).toBe('Ménages concernés en 2021')
      })

      it('should have D34 as "Part retenue"', () => {
        expect(epciSheet.getCell('D34').value).toBe('Part retenue')
      })
    })

    describe('EPCI sheet - mal-logement values (column C)', () => {
      it('should write Sans-abri total (homeless+hotel+makeShiftHousing) to C35', () => {
        // source_b11=RP, b11_sa=true → rp=500, b11_hotel=true → hotel.rp=150, b11_fortune=true → makeShiftHousing_RP.value=80
        expect(epciSheet.getCell('C35').value).toBe(730)
      })

      it('should write raw hosted FINESS total to C36', () => {
        expect(epciSheet.getCell('C36').value).toBe(200) // hostedFinessData.autreCentre
      })

      it('should write raw cohabitation value to C37', () => {
        expect(epciSheet.getCell('C37').value).toBe(800) // hostedFilocomData.value
      })

      it('should write raw hosted SNE value to C38', () => {
        // b12_heberg_particulier=true → particular=50, b12_heberg_temporaire=true → temporary=30
        expect(epciSheet.getCell('C38').value).toBe(80)
      })

      it('should write raw financial inadequation total to C39', () => {
        // b13_acc=true → nbAllPlus30AccessionPropriete=300
        // b13_plp=true → nbAllPlus30ParcLocatifPrive=400
        expect(epciSheet.getCell('C39').value).toBe(700)
      })

      it('should write raw bad quality total to C40 (source RP)', () => {
        // saniLocNonhlm=100 + saniPpT=150 + saniChflLocNonhlm=50 + saniChflPpT=75
        expect(epciSheet.getCell('C40').value).toBe(375)
      })

      it('should write raw physicalInadequation to C41 (source RP, Mod)', () => {
        // source_b15=RP, b15_surocc=Mod, b15_proprietaire=true → nbMenModPpT=60, b15_loc_hors_hlm=true → nbMenModLocNonHLM=45
        expect(epciSheet.getCell('C41').value).toBe(105)
      })
    })

    describe('EPCI sheet - mal-logement percentages (column D)', () => {
      it('should write percentages in column D', () => {
        expect(epciSheet.getCell('D35').value).toBe('100 %')
        expect(epciSheet.getCell('D36').value).toBe('50 %')
        expect(epciSheet.getCell('D37').value).toBe('50 %')
        expect(epciSheet.getCell('D39').value).toBe('10 %')
        expect(epciSheet.getCell('D40').value).toBe('10 %')
        expect(epciSheet.getCell('D41').value).toBe('10 %')
      })
    })

    describe('EPCI sheet - time horizon from results', () => {
      it('should write projection year to D5', () => {
        expect(epciSheet.getCell('D5').value).toBe(2041)
      })

      it('should write peak year to D7', () => {
        expect(epciSheet.getCell('D7').value).toBe(flowEpci.data.peakYear)
      })
    })
  })

  describe('exportScenario - CSV scenario (Central_C, Filo sources)', () => {
    const CSV_EPCI = '244900809'
    const CSV_PARCTOT = 85000
    const CSV_RP_PROJ = 95000

    const csvEpciScenario = {
      epciCode: CSV_EPCI,
      b2_tx_disparition: 0.004245725,
      b2_tx_restructuration: 0.001454282833333333,
      b2_tx_rs: 0.042302762,
      b2_tx_vacance: 0.08581431513373958,
      b2_tx_vacance_longue: 0.03640466057547562,
      b2_tx_vacance_courte: 0.04940965455826397,
      baseEpci: true,
    }

    const csvSimulation = () => ({
      id: 'sim-csv',
      name: 'Simulation CSV',
      createdAt: new Date('2026-02-24'),
      updatedAt: new Date('2026-02-24'),
      epcis: [{ code: CSV_EPCI, name: 'CC Sèvre et Loire', bassinName: null }],
      scenario: {
        id: 'ef77df01-ac89-4206-b744-4328c0931c55',
        b11_etablissement: ['autreCentre', 'demandeAsile', 'reinsertion', 'centreProvisoire'],
        b11_fortune: true,
        b11_hotel: true,
        b11_part_etablissement: 50,
        b11_sa: true,
        b12_cohab_interg_subie: 30,
        b12_heberg_particulier: true,
        b12_heberg_temporaire: true,
        b13_acc: false,
        b13_plp: true,
        b13_taux_effort: 30,
        b13_taux_reallocation: 90,
        b14_confort: 'RP_abs_sani',
        b14_occupation: 'prop_loc',
        b14_qualite: null,
        b14_taux_reallocation: 50,
        b15_loc_hors_hlm: true,
        b15_proprietaire: false,
        b15_surocc: 'Acc',
        b15_taux_reallocation: 90,
        b17_motif: 'Tout',
        b1_horizon_resorption: 2050,
        b2_scenario: 'Central_C',
        epciScenarios: [csvEpciScenario],
        isConfidential: true,
        millesime: '2021',
        projection: 2033,
        source_b11: 'RP',
        source_b14: 'Filo',
        source_b15: 'Filo',
        createdAt: new Date('2026-02-24'),
        updatedAt: new Date('2026-02-24'),
      },
    })

    const csvResults = (): TResults => ({
      epcisTotals: [
        {
          epciCode: CSV_EPCI,
          total: 2000,
          totalFlux: 1000,
          totalStock: 900,
          vacantAccomodation: 100,
          secondaryAccommodation: 100,
          prepeakTotalStock: 700,
          postpeakTotalStock: 200,
        },
      ],
      flowRequirement: {
        epcis: [
          {
            code: CSV_EPCI,
            data: {
              parcEvolution: { '2021': 0, '2033': 150 },
              housingNeeds: { '2021': 0, '2033': 120 },
              surplusHousing: { '2021': 0, '2033': 30 },
              peakYear: 2030,
            },
            totals: {
              demographicEvolution: 500,
              renewalNeeds: 120,
              secondaryResidenceAccomodationEvolution: 180,
              surplusHousing: 60,
              housingNeeds: 250,
              vacantAccomodation: 100,
              shortTermVacantAccomodation: 60,
              longTermVacantAccomodation: 40,
            },
            metadata: { max: 600, min: 0 },
          },
        ],
      },
      sitadel: {
        epcis: [
          {
            code: CSV_EPCI,
            data: [{ year: 2021, authorizedHousingCount: 150, startedHousingCount: 130 }],
            metadata: { max: 250, min: 0 },
          },
        ],
      },
      noAccomodation: { epcis: [{ epciCode: CSV_EPCI, value: 120, prorataValue: 90 }], total: 120, prorataTotal: 90 },
      hosted: { epcis: [{ epciCode: CSV_EPCI, value: 250, prorataValue: 190 }], total: 250, prorataTotal: 190 },
      financialInadequation: { epcis: [{ epciCode: CSV_EPCI, value: 180, prorataValue: 140 }], total: 180, prorataTotal: 140 },
      badQuality: { epcis: [{ epciCode: CSV_EPCI, value: 100, prorataValue: 75 }], total: 100, prorataTotal: 75 },
      physicalInadequation: { epcis: [{ epciCode: CSV_EPCI, value: 140, prorataValue: 105 }], total: 140, prorataTotal: 105 },
      total: 2000,
      totalFlux: 1000,
      totalStock: 900,
      vacantAccomodation: 100,
      secondaryAccommodation: 180,
    })

    let workbook: ExcelJS.Workbook
    let epciSheet: ExcelJS.Worksheet
    const results = csvResults()

    beforeEach(async () => {
      const simulation = csvSimulation()

      prisma.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(simulation as any)
      resultsService.getResults.mockResolvedValue({ ...simulation, results } as any)
      accommodationRatesService.getAccommodationRates.mockResolvedValue({
        [CSV_EPCI]: {
          vacancyRate: 0.0858,
          longTermVacancyRate: 0.0358,
          shortTermVacancyRate: 0.05,
          txRs: 0.045,
          urbanRenewal: 80000,
          vacancy: { nbAccommodation: 4000, year: 2021 },
          restructuringRate: 0.0015,
          disappearanceRate: 0.0043,
          totalVacantCount: 7000,
          longTermVacantCount: 3000,
        },
      } as any)
      demographicEvolutionService.getDemographicEvolutionPopulationByEpci.mockResolvedValue({
        [CSV_EPCI]: {
          data: [
            { year: 2021, central: 300000, haute: 310000, basse: 290000 },
            { year: 2030, central: 310000, haute: 320000, basse: 300000 },
          ],
          metadata: { max: 320000, min: 290000 },
        },
      } as any)
      demographicEvolutionService.getDemographicEvolution.mockResolvedValue({
        [CSV_EPCI]: {
          data: [
            { year: 2021, centralB: 0, centralC: 90000, centralH: 0, phB: 0, phC: 0, phH: 0, pbB: 0, pbC: 0, pbH: 0 },
            { year: 2030, centralB: 0, centralC: CSV_RP_PROJ, centralH: 0, phB: 0, phC: 0, phH: 0, pbB: 0, pbC: 0, pbH: 0 },
          ],
          metadata: { max: CSV_RP_PROJ, min: 90000 },
        },
      } as any)

      prisma.filocomFlux.findUnique = jest.fn().mockResolvedValue({
        epciCode: CSV_EPCI,
        parctot: CSV_PARCTOT,
        txLvParctot: 0.0858,
        txRsParctot: 0.045,
      } as any)
      prisma.hostedFiness.findUnique = jest.fn().mockResolvedValue({
        epciCode: CSV_EPCI,
        autreCentre: 120,
        demandeAsile: 95,
        reinsertion: 180,
        centreProvisoire: 60,
      } as any)
      prisma.hostedFilocom.findUnique = jest.fn().mockResolvedValue({ epciCode: CSV_EPCI, value: 620 } as any)
      prisma.hostedSne.findUnique = jest.fn().mockResolvedValue({ epciCode: CSV_EPCI, particular: 45, temporary: 25 } as any)
      prisma.financialInadequation.findUnique = jest.fn().mockResolvedValue({
        epciCode: CSV_EPCI,
        nbAllPlus30AccessionPropriete: 200,
        nbAllPlus30ParcLocatifPrive: 350,
      } as any)
      prisma.badQuality_Filocom.findUnique = jest.fn().mockResolvedValue({ epciCode: CSV_EPCI, pppiLp: 280, pppiPo: 190 } as any)
      prisma.badQuality_RP.findUnique = jest.fn().mockResolvedValue(null)
      prisma.badQuality_Fonciers.findUnique = jest.fn().mockResolvedValue(null)
      prisma.physicalInadequation_Filo.findUnique = jest.fn().mockResolvedValue({
        epciCode: CSV_EPCI,
        suroccLourdePo: 0,
        suroccLourdeLp: 70,
      } as any)
      prisma.physicalInadequation_RP.findUnique = jest.fn().mockResolvedValue(null)
      prisma.homeless.findUnique = jest.fn().mockResolvedValue({ epciCode: CSV_EPCI, rp: 300, sne: 250 } as any)
      prisma.hotel.findUnique = jest.fn().mockResolvedValue({ epciCode: CSV_EPCI, rp: 100, sne: 90 } as any)
      prisma.makeShiftHousing_RP.findUnique = jest.fn().mockResolvedValue({ epciCode: CSV_EPCI, value: 50 } as any)
      prisma.makeShiftHousing_SNE.findUnique = jest.fn().mockResolvedValue(null)

      const result = await service.exportScenario('sim-csv')
      workbook = result.workbook
      epciSheet = workbook.worksheets[1]
    })

    describe('time horizon', () => {
      it('should write projection=2033 and horizon=2050', () => {
        expect(epciSheet.getCell('D5').value).toBe(2033)
        expect(epciSheet.getCell('D6').value).toBe(2050)
      })

      it('should write peakYear=2030', () => {
        expect(epciSheet.getCell('D7').value).toBe(2030)
      })
    })

    describe('demographic section with Central_C', () => {
      it('should write ménages from centralC key at peakYear', () => {
        // getOmphaleKey('Central_C') = 'centralC', targetYear = min(peakYear=2030, projection=2033) = 2030
        expect(epciSheet.getCell('D11').value).toBe(CSV_RP_PROJ)
        expect(epciSheet.getCell('C11').value).toBe(90000) // 2021 value
      })

      it('should write population from central key', () => {
        // getPopulationKey('Central_C') = 'central'
        expect(epciSheet.getCell('D10').value).toBe(310000) // 2030 value
        expect(epciSheet.getCell('C10').value).toBe(300000) // 2021 value
      })
    })

    describe('projected housing stock with real rates', () => {
      // txRpProj = 1 - b2_tx_rs - b2_tx_vacance_longue - b2_tx_vacance_courte
      const txRpProj = 1 - csvEpciScenario.b2_tx_rs - csvEpciScenario.b2_tx_vacance_longue - csvEpciScenario.b2_tx_vacance_courte
      const parctotProj = CSV_RP_PROJ / txRpProj

      it('should compute D19-D21 from millesime values + flow besoin', () => {
        // D15 = CSV_PARCTOT * shortTermVacancyRate = 85000 * 0.05 = 4250
        // D16 = CSV_PARCTOT * longTermVacancyRate = 85000 * 0.0358 = 3043
        const d15 = Math.round(CSV_PARCTOT * 0.05)
        const d16 = Math.round(CSV_PARCTOT * 0.0358)
        const csvFlowEpci = results.flowRequirement.epcis[0]
        const d20 = d15 + csvFlowEpci.totals.shortTermVacantAccomodation // 4250 + 60
        const d21 = d16 + csvFlowEpci.totals.longTermVacantAccomodation // 3043 + 40
        expect(epciSheet.getCell('D20').value).toBe(d20)
        expect(epciSheet.getCell('D21').value).toBe(d21)
        expect(epciSheet.getCell('D19').value).toBe(d20 + d21)
      })

      it('should compute D26 with parctotProj', () => {
        expect(epciSheet.getCell('D26').value).toBe(Math.round(parctotProj * csvEpciScenario.b2_tx_rs))
      })

      it('should use filocom parctot for 2021 rows D14-D16', () => {
        expect(epciSheet.getCell('D14').value).toBe(Math.round(CSV_PARCTOT * 0.0858))
        expect(epciSheet.getCell('D15').value).toBe(Math.round(CSV_PARCTOT * 0.05))
        expect(epciSheet.getCell('D16').value).toBe(Math.round(CSV_PARCTOT * 0.0358))
      })
    })

    describe('mal-logement with Filo sources and different params', () => {
      it('should write Sans-abri total to C35', () => {
        // source_b11=RP, b11_sa=true → rp=300, b11_hotel=true → hotel.rp=100, b11_fortune=true → makeShiftHousing_RP.value=50
        expect(epciSheet.getCell('C35').value).toBe(450)
      })

      it('should write sum of 4 FINESS fields to C36', () => {
        // autreCentre=120 + demandeAsile=95 + reinsertion=180 + centreProvisoire=60
        expect(epciSheet.getCell('C36').value).toBe(455)
      })

      it('should write cohabitation to C37', () => {
        expect(epciSheet.getCell('C37').value).toBe(620)
      })

      it('should write hosted SNE to C38', () => {
        // particular=45 + temporary=25 = 70
        expect(epciSheet.getCell('C38').value).toBe(70)
      })

      it('should write only PLP to C39 when b13_acc=false', () => {
        // b13_acc=false → no accession, b13_plp=true → nbAllPlus30ParcLocatifPrive=350
        expect(epciSheet.getCell('C39').value).toBe(350)
      })

      it('should write Filocom bad quality to C40 (source_b14=Filo)', () => {
        // pppiLp=280 + pppiPo=190 = 470
        expect(epciSheet.getCell('C40').value).toBe(470)
      })

      it('should write raw physicalInadequation_Filo to C41 (source_b15=Filo, Acc)', () => {
        // source_b15=Filo, b15_surocc=Acc → Lourde, b15_proprietaire=false → 0, b15_loc_hors_hlm=true → suroccLourdeLp=70
        expect(epciSheet.getCell('C41').value).toBe(70)
      })
    })

    describe('mal-logement percentages', () => {
      it('should write correct percentages in column D', () => {
        expect(epciSheet.getCell('D35').value).toBe('100 %')
        expect(epciSheet.getCell('D36').value).toBe('50 %') // b11_part_etablissement
        expect(epciSheet.getCell('D37').value).toBe('30 %') // b12_cohab_interg_subie
        expect(epciSheet.getCell('D39').value).toBe('90 %') // b13_taux_reallocation
        expect(epciSheet.getCell('D40').value).toBe('50 %') // b14_taux_reallocation
        expect(epciSheet.getCell('D41').value).toBe('90 %') // b15_taux_reallocation
      })
    })

    describe('mal-logement labels', () => {
      it('should show Filo source labels for A40 and A41', () => {
        expect(epciSheet.getCell('A40').value).toBe('Mauvaise qualité - PPPI Noyau dur (CGDD/SDES à partir de données fiscales)')
        expect(epciSheet.getCell('A41').value).toBe('Logements suroccupés - CGDD/SDES')
      })

      it('should show 4 FINESS établissements in B36', () => {
        const b36 = epciSheet.getCell('B36').value as string
        expect(b36).toContain("Autre centre d'accueil")
        expect(b36).toContain("Centre d'accueil demandeur d'asile")
        expect(b36).toContain("Centre d'hébergement réinsertion sociale")
        expect(b36).toContain('Centre provisoire hébergement')
      })

      it('should show hosted label in B38', () => {
        // b12_heberg_particulier=true, b12_heberg_temporaire=true
        expect(epciSheet.getCell('B38').value).toBe('Logés chez un particulier - Logés temporairement')
      })

      it('should show PLP-only category in B39', () => {
        // getBadHousingCategoryLabel(b13_plp=true, b13_acc=false) → 'Locataires du parc privé'
        expect(epciSheet.getCell('B39').value).toBe('Locataires du parc privé - Taux effort 30 %')
      })

      it('should show Acc suroccupation level in B41', () => {
        const b41 = epciSheet.getCell('B41').value as string
        expect(b41).toContain('Suroccupation accentuée')
      })
    })

    describe('results section', () => {
      it('should write totals from results', () => {
        expect(epciSheet.getCell('G5').value).toBe(2000)
        expect(epciSheet.getCell('G6').value).toBe(100)
      })

      it('should write flow requirement totals', () => {
        expect(epciSheet.getCell('G9').value).toBe(500)
        expect(epciSheet.getCell('G10').value).toBe(60)
        expect(epciSheet.getCell('G11').value).toBe(40)
        expect(epciSheet.getCell('G12').value).toBe(180)
        expect(epciSheet.getCell('G13').value).toBe(120)
      })

      it('should write bad housing stock results with H column (peakYear != projection)', () => {
        // peakYear=2030, projection=2033 → showTotalColumn=true
        expect(epciSheet.getCell('G15').value).toBe(700) // prepeakTotalStock
        expect(epciSheet.getCell('H15').value).toBe(900) // prepeak + postpeak
      })
    })
  })

  describe('exportScenario - millesime labels and rates (2022)', () => {
    it('should use millesime year and 2022 short/long vacancy rates in Excel cells', async () => {
      const simulation = makeSimulationData()
      simulation.scenario.millesime = '2022'

      prisma.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(simulation as any)
      resultsService.getResults.mockResolvedValue({ ...simulation, results: makeResults() } as any)
      accommodationRatesService.getAccommodationRates.mockResolvedValue({
        [EPCI_CODE]: {
          vacancyRate: 0.08,
          longTermVacancyRate: 0.03,
          shortTermVacancyRate: 0.05,
          txRs: 0.06,
          urbanRenewal: PARCTOT,
          vacancy: { nbAccommodation: 5000, year: 2022 },
          restructuringRate: 0.018,
          disappearanceRate: 0.03,
          totalVacantCount: 8000,
          longTermVacantCount: 4000,
        },
      } as any)
      demographicEvolutionService.getDemographicEvolutionPopulationByEpci.mockResolvedValue(makeDemographicPopulation() as any)
      demographicEvolutionService.getDemographicEvolution.mockResolvedValue(makeDemographicMenages() as any)

      prisma.filocomFlux.findUnique = jest.fn().mockResolvedValue({
        epciCode: EPCI_CODE,
        parctot: PARCTOT,
        txLvParctot: 0.08,
        txRsParctot: 0.06,
      } as any)
      prisma.hostedFiness.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, autreCentre: 200 } as any)
      prisma.hostedFilocom.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, value: 800 } as any)
      prisma.hostedSne.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, particular: 50, temporary: 30 } as any)
      prisma.financialInadequation.findUnique = jest.fn().mockResolvedValue({
        epciCode: EPCI_CODE,
        nbAllPlus30AccessionPropriete: 300,
        nbAllPlus30ParcLocatifPrive: 400,
      } as any)
      prisma.badQuality_RP.findUnique = jest.fn().mockResolvedValue({
        epciCode: EPCI_CODE,
        saniLocNonhlm: 100,
        saniPpT: 150,
        saniChflLocNonhlm: 50,
        saniChflPpT: 75,
      } as any)
      prisma.badQuality_Filocom.findUnique = jest.fn().mockResolvedValue(null)
      prisma.badQuality_Fonciers.findUnique = jest.fn().mockResolvedValue(null)
      prisma.physicalInadequation_RP.findUnique = jest.fn().mockResolvedValue({
        epciCode: EPCI_CODE,
        nbMenModPpt: 60,
        nbMenModLocNonHLM: 45,
      } as any)
      prisma.physicalInadequation_Filo.findUnique = jest.fn().mockResolvedValue(null)
      prisma.homeless.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, rp: 500, sne: 400 } as any)
      prisma.hotel.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, rp: 150, sne: 120 } as any)
      prisma.makeShiftHousing_RP.findUnique = jest.fn().mockResolvedValue({ epciCode: EPCI_CODE, value: 80 } as any)
      prisma.makeShiftHousing_SNE.findUnique = jest.fn().mockResolvedValue(null)

      const result = await service.exportScenario('sim-1')
      const epciSheet = result.workbook.worksheets[1]

      expect(epciSheet.getCell('A14').value).toBe('Situation en 2022')
      expect(epciSheet.getCell('C14').value).toBe('8.00')
      expect(epciSheet.getCell('C15').value).toBe('5.00')
      expect(epciSheet.getCell('C16').value).toBe('3.00')
      expect(epciSheet.getCell('A29').value).toBe('Taux observés entre 2015 et 2022')
      expect(epciSheet.getCell('C29').value).toBe('1.80')
      expect(epciSheet.getCell('D29').value).toBe(Math.round(PARCTOT * 0.018))
      expect(accommodationRatesService.getAccommodationRates).toHaveBeenCalledWith(EPCI_CODE, '2022')
      expect(accommodationRatesService.getAccommodationRates.mock.calls.some(([, millesime]) => millesime === undefined)).toBe(false)
    })
  })
})
