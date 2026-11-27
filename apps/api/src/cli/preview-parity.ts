#!/usr/bin/env node
/**
 * Parité « aperçu » / page de résultats, de bout en bout.
 *
 * L'encart d'estimation (et le menu « Aperçu calcul ») interroge `POST /simulations/preview` pendant
 * le paramétrage ; la page de résultats lit `GET /simulations/:id/results` une fois la simulation
 * enregistrée. Les deux doivent afficher exactement les mêmes chiffres.
 *
 * Ce script monte l'application complète (`MainModule`) derrière un vrai serveur HTTP, sur la base
 * locale, pour que le `CalculationContext` porté par la requête soit celui de la production. Pour
 * chaque cas tiré au hasard (EPCI, millésime, scénario Omphale, horizon, taux modifiés), il :
 *
 *   1. demande l'aperçu de création, avec le payload de `useCreationPreviewPayload` ;
 *   2. crée la simulation, avec le corps de `create-simulation-form.tsx` ;
 *   3. lit la page de résultats et compare ;
 *   4. modifie les paramètres : aperçu de modification (`useModifyPreviewPayload`), puis
 *      enregistrement (`PUT /simulations/:id/scenario`) et nouvelle lecture des résultats ;
 *   5. supprime tout ce qu'il a créé (utilisateur jetable, simulations, scénarios).
 *
 * Seules les gardes d'authentification (et le plafond de débit) sont remplacées : elles posent un
 * utilisateur jetable sur la requête.
 *
 *   pnpm -F api preview-parity                     # 10 cas
 *   pnpm -F api preview-parity --cases 50 --seed 7
 *   pnpm -F api preview-parity --epcis 200069672,200040590 --verbose
 */
import { ExecutionContext, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { ThrottlerGuard } from '@nestjs/throttler'
import { buildEstimationBreakdown, EstimationBreakdownInput } from '@otelo/shared'
import { AuthGuard as BetterAuthGuard } from '@thallesp/nestjs-better-auth'
import { Command } from 'commander'
import { randomUUID } from 'crypto'
import { AddressInfo } from 'net'
import { AuthorizationGuard } from '~/common/guards/authorization.guard'
import { env } from '~/config/env'
import { PrismaService } from '~/db/prisma.service'
import { isIleDeFranceEpci } from '~/epcis/ile-de-france'
import { Role } from '~/generated/prisma/enums'
import { MainModule } from '~/main.module'

const OMPHALE_SCENARIOS = ['Central_B', 'Central_C', 'Central_H', 'PB_B', 'PB_C', 'PB_H', 'PH_B', 'PH_C', 'PH_H']
const MAX_PROJECTION_YEAR = 2050
const DEFAULT_PROJECTION_YEAR = 2030

type TRates = {
  vacancyRate: number
  longTermVacancyRate: number
  shortTermVacancyRate: number
  txRs: number
  restructuringRate: number
  disappearanceRate: number
}

type TResults = EstimationBreakdownInput & Record<string, unknown>

type TCase = {
  label: string
  epcis: string[]
  /** `null` : l'URL de création ne porte pas de millésime. */
  millesime: string | null
  omphale: string
  /** `null` : aucune projection dans l'URL, le formulaire retombe sur sa valeur par défaut. */
  projection: number | null
  baseEpci: string
  ratesFactor: Record<string, Partial<Record<keyof TRates, number>>>
}

type TDiff = { path: string; preview: unknown; results: unknown }
type TOutcome = { label: string; step: 'création' | 'modification'; diffs: TDiff[]; panelDiffs: TDiff[] }

// ——— Aléa reproductible ———————————————————————————————————————————————————————————————

const createRandom = (seed: number) => {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (p: number) => next() < p,
    sample: <T>(items: readonly T[], count: number): T[] => {
      const pool = [...items]
      const out: T[] = []
      while (out.length < count && pool.length > 0) out.push(pool.splice(Math.floor(next() * pool.length), 1)[0])
      return out
    },
  }
}
type TRandom = ReturnType<typeof createRandom>

// ——— Règles recopiées du front (apps/web) ———————————————————————————————————————————————

/** `apps/web/src/utils/projection.ts` */
const clampProjectionYear = (projection: number, millesime?: string | null): number => {
  const year = Number(millesime)
  const minYear = (Number.isFinite(year) && year > 0 ? year : 2021) + 1
  return Math.min(Math.max(projection, minYear), MAX_PROJECTION_YEAR)
}

const toEpciScenario = (rates: TRates) => ({
  b2_tx_rs: rates.txRs,
  b2_tx_vacance: rates.vacancyRate,
  b2_tx_vacance_longue: rates.longTermVacancyRate,
  b2_tx_vacance_courte: rates.shortTermVacancyRate,
  b2_tx_restructuration: rates.restructuringRate,
  b2_tx_disparition: rates.disappearanceRate,
})

/** `apps/web/src/hooks/use-creation-preview-payload.ts` */
const buildCreationPreviewPayload = (c: TCase, rates: Record<string, TRates>) => {
  const epciScenarios: Record<string, Record<string, unknown>> = {}
  for (const code of c.epcis) {
    if (!rates[code]) continue
    epciScenarios[code] = { ...toEpciScenario(rates[code]), baseEpci: c.baseEpci === code }
  }
  const scenario: Record<string, unknown> = {}
  if (c.omphale) scenario.b2_scenario = c.omphale
  if (c.projection) scenario.projection = c.projection
  if (c.millesime) scenario.millesime = c.millesime
  return { epcis: c.epcis, scenario, epciScenarios }
}

/** `apps/web/src/components/simulations/settings/create-simulation-form.tsx` */
const buildCreateBody = (c: TCase, rates: Record<string, TRates>) => ({
  name: `preview-parity ${c.label}`,
  millesime: c.millesime || undefined,
  epci: c.epcis.map((code) => ({ code })),
  scenario: {
    b2_scenario: c.omphale,
    epcis: Object.fromEntries(c.epcis.map((code) => [code, { ...toEpciScenario(rates[code]), baseEpci: c.baseEpci === code }])),
    projection: clampProjectionYear(c.projection ?? DEFAULT_PROJECTION_YEAR, c.millesime),
  },
})

/** `apps/web/src/hooks/use-modify-preview-payload.ts` */
const buildModifyPreviewPayload = (
  simulationId: string,
  settings: { b2_scenario: string; projection: number; millesime: string; epciScenarios: Record<string, TRates> },
) => ({
  simulationId,
  scenario: { b2_scenario: settings.b2_scenario, projection: settings.projection, millesime: settings.millesime },
  epciScenarios: Object.fromEntries(Object.entries(settings.epciScenarios).map(([code, r]) => [code, toEpciScenario(r)])),
})

// ——— Comparaison ———————————————————————————————————————————————————————————————————————

/** Champs qui changent d'un appel à l'autre sans rien dire du calcul. */
const VOLATILE_KEYS = new Set(['createdAt', 'updatedAt', 'calculatedAt', 'id', 'name', 'scenarioId'])

const deepDiff = (a: unknown, b: unknown, path = '', out: TDiff[] = []): TDiff[] => {
  if (typeof a === 'number' && typeof b === 'number') {
    if (!(Math.abs(a - b) < 1e-9 || (Number.isNaN(a) && Number.isNaN(b)))) out.push({ path, preview: a, results: b })
    return out
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    // Les listes d'EPCI ne sont pas garanties dans le même ordre : on les apparie par code.
    const keyOf = (item: unknown) => {
      const record = item as Record<string, unknown> | null
      return (record?.code ?? record?.epciCode) as string | undefined
    }
    if (a.every((item) => keyOf(item)) && b.every((item) => keyOf(item))) {
      const byKey = new Map(b.map((item) => [keyOf(item), item]))
      for (const item of a) {
        const key = keyOf(item)
        if (!byKey.has(key)) out.push({ path: `${path}[${key}]`, preview: 'présent', results: 'absent' })
        else deepDiff(item, byKey.get(key), `${path}[${key}]`, out)
        byKey.delete(key)
      }
      for (const key of byKey.keys()) out.push({ path: `${path}[${key}]`, preview: 'absent', results: 'présent' })
      return out
    }
    if (a.length !== b.length) out.push({ path: `${path}.length`, preview: a.length, results: b.length })
    for (let i = 0; i < Math.min(a.length, b.length); i++) deepDiff(a[i], b[i], `${path}[${i}]`, out)
    return out
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      if (VOLATILE_KEYS.has(key)) continue
      deepDiff((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], path ? `${path}.${key}` : key, out)
    }
    return out
  }
  if (a !== b) out.push({ path, preview: a, results: b })
  return out
}

/** Les chiffres que l'encart affiche réellement : les dix termes, sur le territoire puis EPCI par EPCI. */
const panelFigures = (results: TResults, epcis: string[]) => ({
  total: (results as unknown as { total: number }).total,
  territoire: buildEstimationBreakdown(results).values,
  ...Object.fromEntries(epcis.map((code) => [code, buildEstimationBreakdown(results, { epciCode: code }).values])),
})

const compare = (label: string, step: TOutcome['step'], preview: TResults, results: TResults, epcis: string[]): TOutcome => ({
  label,
  step,
  diffs: deepDiff(preview, results),
  panelDiffs: deepDiff(panelFigures(preview, epcis), panelFigures(results, epcis)),
})

// ——— Application ———————————————————————————————————————————————————————————————————————

const assertLocalDatabase = () => {
  const host = new URL(env.DATABASE_URL).hostname
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error(`Base « ${host} » refusée : ce script crée et supprime des données, il ne tourne que sur une base locale.`)
  }
}

const bootApp = async (user: Record<string, unknown>): Promise<{ app: INestApplication; baseUrl: string }> => {
  // Les gardes globales sont enregistrées par `APP_GUARD` (dont une par le module better-auth) : on
  // remplace leur comportement à la source plutôt que de compter sur `overrideGuard`.
  const authenticate = async (context: ExecutionContext) => {
    context.switchToHttp().getRequest().user = user
    return true
  }
  BetterAuthGuard.prototype.canActivate = authenticate
  AuthorizationGuard.prototype.canActivate = authenticate
  ThrottlerGuard.prototype.canActivate = async () => true

  const moduleRef = await Test.createTestingModule({ imports: [MainModule] }).compile()

  const app = moduleRef.createNestApplication({ logger: ['error'] })
  app.setGlobalPrefix('api')
  await app.listen(0, '127.0.0.1')
  const { port } = app.getHttpServer().address() as AddressInfo
  return { app, baseUrl: `http://127.0.0.1:${port}/api` }
}

const createClient =
  (baseUrl: string) =>
  async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${text.slice(0, 500)}`)
    return (text ? JSON.parse(text) : undefined) as T
  }
type TClient = ReturnType<typeof createClient>

const fetchRates = async (http: TClient, epcis: string[], millesime: string | null): Promise<Record<string, TRates>> => {
  const query = new URLSearchParams({ epcis: epcis.join(',') })
  if (millesime) query.set('millesime', millesime)
  return http<Record<string, TRates>>('GET', `/accommodation-rates?${query}`)
}

const perturbRates = (rates: Record<string, TRates>, factors: TCase['ratesFactor']): Record<string, TRates> =>
  Object.fromEntries(
    Object.entries(rates).map(([code, r]) => {
      const f = factors[code] ?? {}
      const out = { ...r }
      for (const [key, factor] of Object.entries(f) as Array<[keyof TRates, number]>) {
        out[key] = Math.round(r[key] * factor * 1e6) / 1e6
      }
      return [code, out]
    }),
  )

const randomRatesFactor = (random: TRandom, epcis: string[]): TCase['ratesFactor'] =>
  Object.fromEntries(
    epcis
      .filter(() => random.chance(0.6))
      .map((code) => {
        const keys: Array<keyof TRates> = ['txRs', 'longTermVacancyRate', 'shortTermVacancyRate', 'restructuringRate', 'disappearanceRate']
        return [code, Object.fromEntries(random.sample(keys, random.int(1, 3)).map((k) => [k, 0.5 + random.next()]))]
      }),
  )

const buildCases = async (
  prisma: PrismaService,
  random: TRandom,
  count: number,
  forcedEpcis?: string[],
  forcedMillesime?: string,
): Promise<TCase[]> => {
  const millesimes = (await prisma.dataPackVersion.findMany({ select: { millesime: true } })).map((d) => d.millesime)
  // Territoires réalistes : un EPCI et quelques voisins. L'Île-de-France est refusée aux comptes
  // USER, et un EPCI sans projection INSEE n'a pas de scénario Omphale.
  const eligible = new Set(
    (await prisma.epci.findMany({ where: { noInseeProjection: false }, select: { code: true } }))
      .map((e) => e.code)
      .filter((code) => !isIleDeFranceEpci(code)),
  )
  const contiguity = await prisma.ePCIContiguity.findMany({ select: { epciCode: true, contiguousEpciCode: true } })
  const neighbours = new Map<string, string[]>()
  for (const { epciCode, contiguousEpciCode } of contiguity) {
    if (!eligible.has(epciCode) || !eligible.has(contiguousEpciCode) || epciCode === contiguousEpciCode) continue
    neighbours.set(epciCode, [...(neighbours.get(epciCode) ?? []), contiguousEpciCode])
  }
  const pickTerritory = () => {
    const first = random.pick([...eligible])
    return [first, ...random.sample(neighbours.get(first) ?? [], random.int(0, 2))]
  }

  return Array.from({ length: count }, (_, i) => {
    const selected = forcedEpcis ?? pickTerritory()
    const millesime = forcedMillesime ?? (random.chance(0.25) ? null : random.pick(millesimes))
    const projection = random.chance(0.15) ? null : random.int(Number(millesime ?? 2021) + 1, MAX_PROJECTION_YEAR)
    return {
      label: `#${i + 1}`,
      epcis: selected,
      millesime,
      omphale: random.pick(OMPHALE_SCENARIOS),
      projection,
      baseEpci: random.pick(selected),
      ratesFactor: randomRatesFactor(random, selected),
    }
  })
}

const getResults = async (http: TClient, simulationId: string): Promise<TResults> => {
  const grouped = await http<{ simulations: Record<string, { results: TResults }> }>('GET', `/simulations/${simulationId}/results`)
  return grouped.simulations[simulationId].results
}

const runCase = async (http: TClient, c: TCase, random: TRandom, report: (o: TOutcome) => void): Promise<void> => {
  // 1–3. Création.
  const rates = perturbRates(await fetchRates(http, c.epcis, c.millesime), c.ratesFactor)
  const preview = await http<TResults>('POST', '/simulations/preview', buildCreationPreviewPayload(c, rates))
  const created = await http<{ id: string }>('POST', '/simulations', buildCreateBody(c, rates))
  const results = await getResults(http, created.id)
  report(compare(c.label, 'création', preview, results, c.epcis))

  // 4. Modification des paramètres démographiques, comme depuis /simulation/:id/modifier.
  const { scenario } = await http<{ scenario: { millesime: string; projection: number; b2_scenario: string } }>(
    'GET',
    `/simulations/${created.id}/scenario`,
  )
  const modifiedRates = perturbRates(rates, randomRatesFactor(random, c.epcis))
  const settings = {
    b2_scenario: random.pick(OMPHALE_SCENARIOS),
    projection: random.int(Number(scenario.millesime) + 1, MAX_PROJECTION_YEAR),
    millesime: scenario.millesime,
    epciScenarios: modifiedRates,
  }
  const modifyPreview = await http<TResults>('POST', `/simulations/${created.id}/preview`, buildModifyPreviewPayload(created.id, settings))
  await http('PUT', `/simulations/${created.id}/scenario`, {
    b2_scenario: settings.b2_scenario,
    projection: settings.projection,
    epciScenarios: Object.fromEntries(Object.entries(modifiedRates).map(([code, r]) => [code, toEpciScenario(r)])),
  })
  const modifiedResults = await getResults(http, created.id)
  report(
    compare(
      `${c.label} (→ ${settings.b2_scenario}, ${scenario.projection}→${settings.projection})`,
      'modification',
      modifyPreview,
      modifiedResults,
      c.epcis,
    ),
  )
}

const describeCase = (c: TCase) =>
  `${c.label} EPCI=${c.epcis.join('+')} millésime=${c.millesime ?? '(absent)'} omphale=${c.omphale} projection=${c.projection ?? '(absente)'} taux modifiés=${Object.keys(c.ratesFactor).length}`

const printOutcome = (o: TOutcome, verbose: boolean) => {
  const status = o.diffs.length === 0 ? '✓' : '✗'
  console.log(
    `  ${status} ${o.step.padEnd(12)} ${o.label} — ${o.panelDiffs.length} écart(s) dans l'encart, ${o.diffs.length} dans le JSON complet`,
  )
  const shown = verbose ? o.diffs : o.panelDiffs.length > 0 ? o.panelDiffs : o.diffs.slice(0, 5)
  for (const d of shown.slice(0, verbose ? 200 : 12)) {
    console.log(`      ${d.path}: aperçu=${JSON.stringify(d.preview)} résultats=${JSON.stringify(d.results)}`)
  }
}

async function main() {
  const program = new Command()
    .option('--cases <n>', 'nombre de cas tirés au hasard', '10')
    .option('--seed <n>', 'graine du tirage', String(Date.now() % 100000))
    .option('--epcis <codes>', 'impose les EPCI (séparés par des virgules)')
    .option('--millesime <m>', 'impose le millésime')
    .option('--verbose', 'affiche tous les écarts du JSON complet')
    .parse()
  const opts = program.opts<{ cases: string; seed: string; epcis?: string; millesime?: string; verbose?: boolean }>()

  assertLocalDatabase()
  const seed = Number(opts.seed)
  const random = createRandom(seed)

  const email = `preview-parity-${randomUUID()}@otelo.invalid`
  // Connexion propre au script : sert à préparer l'utilisateur jetable et à tout nettoyer, même si le
  // montage de l'application échoue.
  const dbModule = await Test.createTestingModule({ providers: [PrismaService] }).compile()
  const prisma = dbModule.get(PrismaService) as PrismaService
  let app: INestApplication | undefined
  let userId: string | undefined

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Parité aperçu',
        firstname: 'Parité',
        lastname: 'Aperçu',
        role: Role.USER,
        hasAccess: true,
        emailVerified: true,
      },
    })
    userId = user.id

    const booted = await bootApp({ ...user })
    app = booted.app
    const http = createClient(booted.baseUrl)

    const cases = await buildCases(prisma, random, Number(opts.cases), opts.epcis?.split(','), opts.millesime)
    console.log(`Parité aperçu / résultats — ${cases.length} cas, graine ${seed}\n`)

    const outcomes: TOutcome[] = []
    for (const c of cases) {
      console.log(describeCase(c))
      try {
        await runCase(http, c, random, (o) => {
          outcomes.push(o)
          printOutcome(o, Boolean(opts.verbose))
        })
      } catch (error) {
        console.log(`  ! erreur : ${error instanceof Error ? error.message : error}`)
        outcomes.push({ label: c.label, step: 'création', diffs: [{ path: 'erreur', preview: null, results: null }], panelDiffs: [] })
      }
    }

    const failed = outcomes.filter((o) => o.diffs.length > 0)
    const panelFailed = outcomes.filter((o) => o.panelDiffs.length > 0)
    console.log(`\n${outcomes.length - failed.length}/${outcomes.length} comparaisons identiques (JSON complet).`)
    console.log(`${outcomes.length - panelFailed.length}/${outcomes.length} comparaisons identiques sur les chiffres de l'encart.`)
    console.log(`Rejouer : pnpm -F api preview-parity --cases ${opts.cases} --seed ${seed}`)
    process.exitCode = failed.length > 0 ? 1 : 0
  } finally {
    if (userId) {
      const simulations = await prisma.simulation.findMany({ where: { userId }, select: { scenarioId: true } })
      await prisma.simulation.deleteMany({ where: { userId } })
      await prisma.scenario.deleteMany({ where: { id: { in: simulations.map((s) => s.scenarioId) } } })
      await prisma.epciGroup.deleteMany({ where: { userId } })
      await prisma.user.delete({ where: { id: userId } })
    }
    await app?.close()
    await dbModule.close()
  }
}

main().catch((error) => {
  console.error('✗ Erreur fatale:', error)
  process.exit(1)
})
