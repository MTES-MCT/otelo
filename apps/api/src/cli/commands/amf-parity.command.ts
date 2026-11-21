import { Inject, Injectable } from '@nestjs/common'
import { buildEstimationBreakdown, EstimationBreakdownInput } from '@otelo/shared'
import { createHash, randomBytes } from 'crypto'
import { writeFileSync } from 'fs'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { TAmfAnswers } from '~/amf/amf.schemas'
import { AmfService } from '~/amf/amf.service'
import { TAnnualContributions } from '~/amf/amf-result'
import { CoefficientCalculationService } from '~/calculation/coefficient-calculation/coefficient-calculation.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import { TCreateSimulationBody } from '~/external/external.dto'
import { ExternalService } from '~/external/external.service'
import { SimulationsService } from '~/simulations/simulations.service'

/**
 * Règles du questionnaire, recopiées depuis le cahier de retours « Otelo en 5 clics » et volontairement réécrites
 * ici plutôt qu'importées de `amf-scenario.ts` : la référence ne doit pas partager le code qu'elle contrôle.
 * Chaque fourchette est `[variante basse, variante haute]`.
 */
const RULES = {
  horizon: 2036,
  population: { plus: 'PH', tendance: 'Central', moins: 'PB' },
  households: { low: 'C', high: 'H' },
  vacancyRemobilisation: { prioritaire: [0.4, 0.3], 'parmi-autres': [0.2, 0.15], non: [0, 0] },
  secondaryResidencesPoints: { hausse: [0.01, 0.015], stable: [0, 0], maitrise: [-0.007, -0.005], recuperation: [-0.015, -0.01] },
  secondaryResidencesRecoveryShare: 0.02,
  resorption: { low: 2050, high: 2040 },
} as const

const NEUTRALIZED_STOCK = {
  b11_sa: false,
  b11_fortune: false,
  b11_hotel: false,
  b11_etablissement: [],
  b11_part_etablissement: 0,
  b12_cohab_interg_subie: 0,
  b12_heberg_particulier: false,
  b12_heberg_temporaire: false,
  b13_acc: false,
  b13_plp: false,
  b13_taux_reallocation: 100,
  b14_taux_reallocation: 100,
  b15_taux_reallocation: 100,
}

const ANSWER_VALUES = {
  demography: ['moins', 'tendance', 'plus'],
  vacancy: ['prioritaire', 'parmi-autres', 'non'],
  secondaryResidences: ['hausse', 'stable', 'maitrise', 'recuperation'],
  badHousing: [true, false],
} as const

const KEYS: Array<keyof TAnnualContributions> = [
  'total',
  'households',
  'badHousing',
  'fluidity',
  'vacancyRemobilised',
  'secondaryResidences',
]
type TVariant = 'low' | 'high'
const VARIANTS: TVariant[] = ['low', 'high']

type TCase = { epciCode: string; epciName: string; answers: TAmfAnswers }
type TDiff = { variant: TVariant; key: keyof TAnnualContributions; amf: number; reference: number }
type TCaseOutcome = TCase & {
  amf: Record<TVariant, TAnnualContributions>
  reference: Record<TVariant, TAnnualContributions>
  diffs: TDiff[]
}

export type TAmfParityOptions = {
  epcis?: string[]
  sample: number
  combos: number | 'all'
  seed: number
  tolerance: number
  output?: string
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) : le même `--seed` redonne le même panel. */
const seededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const shuffle = <T>(items: T[], random: () => number): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const format = (value: number) => value.toFixed(1).padStart(9)

/**
 * Vérifie, sur un panel de territoires et de jeux de réponses, que le questionnaire AMF donne les mêmes chiffres
 * qu'une simulation Otelo classique paramétrée à l'identique et calculée comme sur la page de résultats.
 *
 * - Côté AMF : `AmfService.estimate`, le code même de `POST /amf/simulations` (variante basse enregistrée, haute en
 *   mémoire), dans le contexte de calcul de l'API externe (coefficient 1).
 * - Côté référence : deux simulations ordinaires (basse et haute) construites à partir de `RULES`, recalculées dans
 *   le contexte de la page de résultats (coefficient tiré de l'horizon de résorption), puis décomposées par
 *   `buildEstimationBreakdown`, comme la carte d'estimation.
 *
 * Toutes les simulations sont rattachées à un consommateur d'API créé pour l'occasion, supprimé à la fin : la
 * suppression en cascade efface simulations, scénarios et résultats.
 */
@Injectable()
export class AmfParityCommand {
  constructor(
    private readonly prisma: PrismaService,
    private readonly amfService: AmfService,
    private readonly externalService: ExternalService,
    private readonly simulationsService: SimulationsService,
    private readonly needsCalculationService: NeedsCalculationService,
    private readonly coefficientCalculationService: CoefficientCalculationService,
    private readonly accommodationRates: AccommodationRatesService,
    private readonly dataPackVersions: DataPackVersionsService,
    @Inject('CalculationContext') private readonly calculationContext: { coefficient: number; baseYear: number; millesime: string },
  ) {}

  async execute(options: TAmfParityOptions): Promise<boolean> {
    this.assertLocalDatabase()
    const { millesime } = await this.dataPackVersions.getActive()
    const random = seededRandom(options.seed)
    const cases = await this.buildCases(options, millesime, random)
    console.log(
      `Millésime ${millesime} — ${cases.length} cas sur ${new Set(cases.map((c) => c.epciCode)).size} EPCI (seed ${options.seed})\n`,
    )

    const consumer = await this.prisma.apiConsumer.create({
      data: {
        name: 'Parité AMF (script)',
        hashedKey: createHash('sha256').update(randomBytes(32)).digest('hex'),
        prefix: 'parity',
        excludedFromStatistics: true,
      },
    })

    const outcomes: TCaseOutcome[] = []
    const failures: Array<{ case: TCase; error: string }> = []
    try {
      for (const [index, testCase] of cases.entries()) {
        const label = `[${index + 1}/${cases.length}] ${testCase.epciCode} ${testCase.epciName} — ${this.describe(testCase.answers)}`
        try {
          const outcome = await this.runCase(consumer.id, testCase, millesime, options.tolerance)
          outcomes.push(outcome)
          console.log(`${outcome.diffs.length === 0 ? '✓' : '✗'} ${label}`)
          for (const diff of outcome.diffs) {
            console.log(
              `    ${diff.variant.padEnd(4)} ${diff.key.padEnd(20)} AMF ${format(diff.amf)}  référence ${format(diff.reference)}  écart ${format(diff.amf - diff.reference)}`,
            )
          }
        } catch (error) {
          failures.push({ case: testCase, error: error instanceof Error ? error.message : String(error) })
          console.log(`! ${label} — ${failures[failures.length - 1].error}`)
        }
      }
    } finally {
      await this.prisma.apiConsumer.delete({ where: { id: consumer.id } })
    }

    this.printSummary(outcomes, failures.length, options.tolerance)
    if (options.output) {
      this.writeCsv(options.output, outcomes)
      console.log(`\nDétail écrit dans ${options.output}`)
    }
    return failures.length === 0 && outcomes.every((outcome) => outcome.diffs.length === 0)
  }

  /** Le script écrit puis supprime des simulations : il ne tourne que sur une base locale. */
  private assertLocalDatabase() {
    const host = new URL(process.env.DATABASE_URL ?? '').hostname
    if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
      throw new Error(`DATABASE_URL pointe sur ${host} : le contrôle de parité ne tourne que sur une base locale.`)
    }
  }

  private async buildCases(options: TAmfParityOptions, millesime: string, random: () => number): Promise<TCase[]> {
    // EPCI calculables par le questionnaire : projections haute et centrale à l'horizon, taux Filocom, hors
    // Île-de-France (fermée aux consommateurs de l'API externe).
    const eligible = await this.prisma.$queryRaw<Array<{ code: string; name: string; has_basse: boolean }>>`
      SELECT e.code, e.name, (p.basse IS NOT NULL) AS has_basse
      FROM epcis e
      JOIN demographic_evolution_population p ON p.epci_code = e.code AND p.millesime = ${millesime} AND p.year = ${RULES.horizon}
      JOIN filocom_flux f ON f.epci_code = e.code AND f.millesime = ${millesime}
      WHERE p.haute IS NOT NULL AND p.central IS NOT NULL AND e.region <> '11'
      ORDER BY e.code`

    const epcis = options.epcis?.length
      ? options.epcis.map((code) => {
          const found = eligible.find((epci) => epci.code === code)
          if (!found) throw new Error(`EPCI ${code} non calculable par le questionnaire (projections, Filocom ou Île-de-France)`)
          return found
        })
      : shuffle(eligible, random).slice(0, options.sample)

    const allCombos: TAmfAnswers[] = []
    for (const demography of ANSWER_VALUES.demography)
      for (const vacancy of ANSWER_VALUES.vacancy)
        for (const secondaryResidences of ANSWER_VALUES.secondaryResidences)
          for (const badHousing of ANSWER_VALUES.badHousing)
            allCombos.push({ epciCode: '', demography, vacancy, secondaryResidences, badHousing })

    return epcis.flatMap((epci) => {
      const available = allCombos.filter((combo) => epci.has_basse || combo.demography !== 'moins')
      const picked = options.combos === 'all' ? available : shuffle(available, random).slice(0, options.combos)
      return picked.map((combo) => ({ epciCode: epci.code, epciName: epci.name, answers: { ...combo, epciCode: epci.code } }))
    })
  }

  private async runCase(consumerId: string, testCase: TCase, millesime: string, tolerance: number): Promise<TCaseOutcome> {
    const baseYear = Number(millesime)

    // Contexte de `POST /amf/simulations` : pas de simulation dans l'URL, coefficient 1.
    Object.assign(this.calculationContext, { coefficient: 1, baseYear, millesime })
    const { contributions: amf } = await this.amfService.estimate(consumerId, testCase.answers)

    const rates = (await this.accommodationRates.getAccommodationRates(testCase.epciCode, millesime))[testCase.epciCode]
    const reference = {} as Record<TVariant, TAnnualContributions>
    for (const [index, variant] of VARIANTS.entries()) {
      const { id } = await this.externalService.createSimulation(consumerId, this.referenceBody(testCase, rates, millesime, variant, index))
      const simulation = await this.simulationsService.get(id)
      // Contexte de la page de résultats : celui que `NeedsCalculationModule` construit à partir de la simulation.
      Object.assign(this.calculationContext, {
        coefficient: this.coefficientCalculationService.calculateCoefficient(
          simulation.scenario.b1_horizon_resorption,
          simulation.scenario.projection,
        ),
        baseYear: Number(simulation.scenario.millesime),
        millesime: simulation.scenario.millesime,
      })
      const results = await this.needsCalculationService.calculate(simulation)
      reference[variant] = this.referenceContributions(results, testCase, baseYear)
    }

    const diffs: TDiff[] = []
    for (const variant of VARIANTS) {
      for (const key of KEYS) {
        const amfValue = amf[variant][key]
        const referenceValue = reference[variant][key]
        if (Math.abs(amfValue - referenceValue) > Math.max(1, tolerance * Math.abs(referenceValue))) {
          diffs.push({ variant, key, amf: amfValue, reference: referenceValue })
        }
      }
    }
    return { ...testCase, amf, reference, diffs }
  }

  /** Simulation telle qu'un utilisateur la paramétrerait dans Otelo pour reproduire la variante. */
  private referenceBody(
    { epciCode, epciName, answers }: TCase,
    rates: { longTermVacancyRate: number; shortTermVacancyRate: number; txRs: number },
    millesime: string,
    variant: TVariant,
    index: number,
  ): TCreateSimulationBody {
    const longTermVacancy = rates.longTermVacancyRate * (1 - RULES.vacancyRemobilisation[answers.vacancy][index])
    return {
      name: `Parité AMF – ${epciName} – ${variant}`,
      epci: [{ code: epciCode }],
      scenario: {
        b1_horizon_resorption: RULES.resorption[variant],
        b2_scenario:
          `${RULES.population[answers.demography]}_${RULES.households[variant]}` as TCreateSimulationBody['scenario']['b2_scenario'],
        projection: RULES.horizon,
        millesime,
        epcis: {
          [epciCode]: {
            baseEpci: true,
            b2_tx_vacance_longue: longTermVacancy,
            b2_tx_vacance_courte: rates.shortTermVacancyRate,
            b2_tx_vacance: longTermVacancy + rates.shortTermVacancyRate,
            b2_tx_rs: Math.max(0, rates.txRs + RULES.secondaryResidencesPoints[answers.secondaryResidences][index]),
            b2_tx_disparition: 0,
            b2_tx_restructuration: 0,
          },
        },
        ...(answers.badHousing ? {} : NEUTRALIZED_STOCK),
      },
    }
  }

  /** Contributions annuelles lues dans les résultats, comme la carte d'estimation, puis réglées par le cahier de retours. */
  private referenceContributions(results: EstimationBreakdownInput, { epciCode, answers }: TCase, baseYear: number): TAnnualContributions {
    const years = RULES.horizon - baseYear
    const { values } = buildEstimationBreakdown(results, { epciCode })
    const shortTerm = values.fluidity - values.fluidityReleased
    const longTerm = values.vacancyIncrease - values.vacancyRemobilised
    const secondary = (values.secondaryIncrease - values.secondaryDecrease) / years
    const engineTotal = Math.max(0, results.epcisTotals.find((epci) => epci.epciCode === epciCode)?.total ?? 0) / years

    let secondaryResidences = secondary
    if (answers.secondaryResidences === 'stable') {
      secondaryResidences = 0
    } else if (answers.secondaryResidences === 'recuperation' && secondary >= 0) {
      secondaryResidences = -RULES.secondaryResidencesRecoveryShare * Math.max(0, engineTotal - secondary)
    }

    return {
      households: (values.demographic + values.disappearanceSurplus - values.appearanceSurplus) / years,
      badHousing: values.badHousing / years,
      fluidity: (Math.max(0, shortTerm) + Math.max(0, longTerm)) / years,
      vacancyRemobilised: (Math.max(0, -shortTerm) + Math.max(0, -longTerm)) / years,
      secondaryResidences,
      // Le total de la page de résultats (« constructions neuves »), corrigé du seul ajustement propre au questionnaire.
      total: engineTotal - secondary + secondaryResidences,
    }
  }

  private describe(answers: TAmfAnswers) {
    return `pop. ${answers.demography}, vacance ${answers.vacancy}, RS ${answers.secondaryResidences}, mal-logement ${answers.badHousing ? 'oui' : 'non'}`
  }

  private printSummary(outcomes: TCaseOutcome[], errors: number, tolerance: number) {
    const mismatches = outcomes.filter((outcome) => outcome.diffs.length > 0).length
    console.log(
      `\n${outcomes.length - mismatches} cas identiques, ${mismatches} en écart, ${errors} en erreur (tolérance : 1 logement/an ou ${tolerance * 100} %)`,
    )
    console.log('\nÉcart maximal par poste (logements/an, AMF − référence) :')
    for (const key of KEYS) {
      const deltas = outcomes.flatMap((outcome) => VARIANTS.map((variant) => outcome.amf[variant][key] - outcome.reference[variant][key]))
      const worst = deltas.reduce((max, delta) => (Math.abs(delta) > Math.abs(max) ? delta : max), 0)
      console.log(`  ${key.padEnd(20)} ${format(worst)}`)
    }
  }

  private writeCsv(path: string, outcomes: TCaseOutcome[]) {
    const header = [
      'epci',
      'nom',
      'demographie',
      'vacance',
      'residences_secondaires',
      'mal_logement',
      'variante',
      'poste',
      'amf',
      'reference',
      'ecart',
    ]
    const rows = outcomes.flatMap((outcome) =>
      VARIANTS.flatMap((variant) =>
        KEYS.map((key) => [
          outcome.epciCode,
          `"${outcome.epciName.replace(/"/g, '""')}"`,
          outcome.answers.demography,
          outcome.answers.vacancy,
          outcome.answers.secondaryResidences,
          outcome.answers.badHousing ? 'oui' : 'non',
          variant,
          key,
          outcome.amf[variant][key].toFixed(3),
          outcome.reference[variant][key].toFixed(3),
          (outcome.amf[variant][key] - outcome.reference[variant][key]).toFixed(3),
        ]),
      ),
    )
    writeFileSync(path, [header, ...rows].map((row) => row.join(',')).join('\n'))
  }
}
