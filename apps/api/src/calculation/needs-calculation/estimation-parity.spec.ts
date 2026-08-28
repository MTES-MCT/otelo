import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { buildEstimationBreakdown, buildEstimationParityReport } from '@shared'
import { FlowRequirementService } from '~/calculation/needs-calculation/besoins-flux/flow-requirement.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { makeEpciScenario, makeScenario, makeSimulation, makeStockRequirementsResults } from './__test-utils__/calculation-test-fixtures'
import { NeedsCalculationService } from './needs-calculation.service'

/**
 * L'encart « Votre estimation en cours » et la page de résultats sont servis par le même
 * `NeedsCalculationService` : leurs chiffres doivent être strictement égaux. L'encart décompose
 * `TResults` en dix termes (`buildEstimationBreakdown`, dans `@shared`), la page affiche les
 * agrégats bruts du moteur. Ce fichier vérifie que les deux lectures coïncident, sur la sortie
 * réelle du service et non sur une formule recopiée.
 */
describe('Parité encart d’estimation / page de résultats', () => {
  let service: NeedsCalculationService
  let flowService: DeepMocked<FlowRequirementService>
  let stockService: DeepMocked<StockRequirementsService>
  let sitadelService: DeepMocked<SitadelService>

  beforeEach(async () => {
    flowService = createMock<FlowRequirementService>()
    stockService = createMock<StockRequirementsService>()
    sitadelService = createMock<SitadelService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeedsCalculationService,
        { provide: FlowRequirementService, useValue: flowService },
        { provide: StockRequirementsService, useValue: stockService },
        { provide: SitadelService, useValue: sitadelService },
      ],
    }).compile()

    service = module.get<NeedsCalculationService>(NeedsCalculationService)
    sitadelService.calculate.mockResolvedValue({ epcis: [] } as any)
    stockService.calculateStock.mockResolvedValue(makeStockRequirementsResults('200000001'))
    stockService.calculateProrataStockByEpci.mockReturnValue({ total: 200, prePeakTotal: 150, postPeakTotal: 50 })
  })

  const makeEpciFlow = (
    code: string,
    totals: {
      demographicEvolution: number
      renewalNeeds: number
      secondaryResidenceAccomodationEvolution: number
      shortTermVacantAccomodation: number
      longTermVacantAccomodation: number
    },
  ) => ({
    code,
    data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
    totals: { ...totals, housingNeeds: 0, surplusHousing: 0, vacantAccomodation: 0 },
    metadata: { max: 2041, min: 2021 },
  })

  const makeMultiEpciSimulation = (codes: string[]) =>
    makeSimulation({
      epcis: codes.map((code, index) => ({ code, name: `EPCI ${index}`, bassinName: null })),
      scenario: makeScenario({ epciScenarios: codes.map((code) => makeEpciScenario({ epciCode: code })) }),
    })

  /**
   * Territoire volontairement contrariant : un EPCI dont la vacance longue augmente pendant qu'un
   * autre la remobilise (le cas remonté en recette), des résidences secondaires et un renouvellement
   * de signes opposés, une fluidité négative, et un EPCI écarté du total.
   */
  const setupContrastedTerritory = () => {
    flowService.calculate.mockResolvedValue({
      epcis: [
        // Vacance longue et renouvellement en hausse, résidences secondaires et fluidité en baisse.
        makeEpciFlow('200000001', {
          demographicEvolution: 400,
          renewalNeeds: 60,
          secondaryResidenceAccomodationEvolution: -30,
          shortTermVacantAccomodation: 25,
          longTermVacantAccomodation: 120,
        }),
        // Signes inversés terme à terme : chaque paire signée est alimentée des deux côtés, et les
        // deux termes d'une même paire ne viennent jamais du même EPCI.
        makeEpciFlow('200000002', {
          demographicEvolution: 300,
          renewalNeeds: -40,
          secondaryResidenceAccomodationEvolution: 50,
          shortTermVacantAccomodation: -15,
          longTermVacantAccomodation: -90,
        }),
        // Flux très négatif : aucun besoin de constructions neuves, l'EPCI sort du total.
        makeEpciFlow('200000003', {
          demographicEvolution: -900,
          renewalNeeds: -25,
          secondaryResidenceAccomodationEvolution: -35,
          shortTermVacantAccomodation: -5,
          longTermVacantAccomodation: -45,
        }),
      ],
    })

    return makeMultiEpciSimulation(['200000001', '200000002', '200000003'])
  }

  it('fait coïncider les cinq grandeurs communes aux deux écrans', async () => {
    const results = await service.calculate(setupContrastedTerritory())

    const report = buildEstimationParityReport(results)

    // Le territoire doit bien exercer les cas litigieux, sans quoi la parité serait vraie par hasard.
    const { values } = buildEstimationBreakdown(results)
    expect(Math.min(values.vacancyIncrease, values.vacancyRemobilised)).toBeGreaterThan(0)
    expect(Math.min(values.secondaryIncrease, values.secondaryDecrease)).toBeGreaterThan(0)
    expect(Math.min(values.disappearanceSurplus, values.appearanceSurplus)).toBeGreaterThan(0)
    expect(Math.min(values.fluidity, values.fluidityReleased)).toBeGreaterThan(0)

    // Message lisible en cas d'échec : on voit d'un coup d'œil quelle ligne a divergé.
    expect(report.filter((row) => !row.matches)).toEqual([])
  })

  it('retrouve le mal-logement retenu par le moteur, EPCI écartés exclus', async () => {
    const results = await service.calculate(setupContrastedTerritory())

    const { values } = buildEstimationBreakdown(results)
    const retainedStock = results.epcisTotals.filter((epci) => epci.total > 0).reduce((sum, epci) => sum + epci.prepeakTotalStock, 0)

    expect(values.badHousing).toBe(retainedStock)
    // `results.totalStock` ne filtre pas les EPCI écartés : il n'est donc pas le B de la carte, et la
    // page de résultats a raison de l'afficher pour ce qu'il est — le mal-logement du territoire.
    expect(results.totalStock).toBeGreaterThan(retainedStock)
  })

  it('somme les dix termes exactement sur le total du moteur', async () => {
    const results = await service.calculate(setupContrastedTerritory())

    const { values } = buildEstimationBreakdown(results)
    const additionalNeed =
      values.demographic +
      values.badHousing +
      values.fluidity +
      values.vacancyIncrease +
      values.secondaryIncrease +
      values.disappearanceSurplus
    const optimisation = values.vacancyRemobilised + values.fluidityReleased + values.secondaryDecrease + values.appearanceSurplus

    expect(additionalNeed - optimisation).toBe(results.total)
  })

  it('écarte du décompte le même EPCI que le moteur', async () => {
    const results = await service.calculate(setupContrastedTerritory())

    const excluded = buildEstimationBreakdown(results, { epciCode: '200000003' })

    expect(results.epcisTotals.find((epci) => epci.epciCode === '200000003')?.total).toBeLessThanOrEqual(0)
    expect(Object.values(excluded.values).every((value) => value === 0)).toBe(true)
  })

  it('restreint à un EPCI la même chose que ce que la page affiche pour lui', async () => {
    const results = await service.calculate(setupContrastedTerritory())

    const scoped = buildEstimationBreakdown(results, { epciCode: '200000001' })
    const epciFlow = results.flowRequirement.epcis.find((epci) => epci.code === '200000001')!
    const epciTotals = results.epcisTotals.find((epci) => epci.epciCode === '200000001')!

    // Les mêmes `max(0, ·)` / `abs(min(0, ·))` que les donuts de la page de résultats.
    expect(scoped.values.vacancyRemobilised).toBe(Math.abs(Math.min(0, epciFlow.totals.longTermVacantAccomodation)))
    expect(scoped.values.secondaryDecrease).toBe(Math.abs(Math.min(0, epciFlow.totals.secondaryResidenceAccomodationEvolution)))
    expect(scoped.values.appearanceSurplus).toBe(Math.abs(Math.min(0, epciFlow.totals.renewalNeeds)))
    expect(scoped.values.fluidity).toBe(Math.max(0, epciFlow.totals.shortTermVacantAccomodation))
    // Colonne « Situations de mal logement » du tableau par EPCI.
    expect(scoped.values.badHousing).toBe(epciTotals.prepeakTotalStock)
  })

  it('ne fait jamais coexister une augmentation et une remobilisation sur un même EPCI', async () => {
    const results = await service.calculate(setupContrastedTerritory())

    for (const epci of results.epcisTotals) {
      const { values } = buildEstimationBreakdown(results, { epciCode: epci.epciCode })
      expect(Math.min(values.vacancyIncrease, values.vacancyRemobilised)).toBe(0)
      expect(Math.min(values.secondaryIncrease, values.secondaryDecrease)).toBe(0)
      expect(Math.min(values.disappearanceSurplus, values.appearanceSurplus)).toBe(0)
      expect(Math.min(values.fluidity, values.fluidityReleased)).toBe(0)
    }
  })
})
