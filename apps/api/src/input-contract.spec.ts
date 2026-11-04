import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { CanActivate, INestApplication, RequestMethod, Type } from '@nestjs/common'
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum'
import { createHttpTestApp } from '@test/http-app'
import { type SampleMode, zodSample } from '@test/zod-sample'
import request from 'supertest'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  AllowAnonymous: () => () => {},
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  OptionalAuth: () => () => {},
}))

/**
 * Contrat d'entrée de toutes les routes qui valident un `@Body()`, un `@Query()` ou un
 * `@Param()` entier.
 *
 * Chaque route est montée derrière un vrai serveur HTTP, services remplacés par des doublures
 * qui enregistrent leurs appels, gardes neutralisées. On rejoue une batterie de requêtes
 * (exemple valide, champ manquant, type faux, clé inconnue, corps vide) et l'on fige en
 * snapshot le statut, le corps de la réponse et ce que le service reçoit réellement.
 *
 * Ces snapshots sont le contrat : un changement de bibliothèque de validation ou de version
 * ne doit pas les modifier. Toute différence est une rupture de contrat à justifier.
 */

const SRC = __dirname
const USER = { id: 'user-test', role: 'ADMIN', hasAccess: true, email: 'user@test.fr' }
const API_CONSUMER = { id: 'consumer-test', name: 'Consumer' }

/**
 * Exemples écrits à la main, là où le générateur ne peut pas satisfaire le schéma
 * (raffinements, motifs). Clé : `Contrôleur.méthode`.
 */
const EPCI_CODES = '200069672,200040715'
/** Une valeur, ou une fonction qui ajuste l'exemple généré. */
type ManualInput = unknown | ((generated: Record<string, unknown>) => unknown)
/** Les dates ne transitent pas en JSON : la liste qui en contient part vide, comme depuis le front. */
const withoutCustomEvolutions = (generated: Record<string, unknown>) => ({
  ...generated,
  scenario: { ...(generated.scenario as Record<string, unknown>), demographicEvolutionOmphaleCustom: [] },
})
const VALID_INPUTS: Record<string, Partial<Record<'body' | 'query' | 'param', ManualInput>>> = {
  'AccommodationRatesController.getAccommodationRates': { query: { epcis: EPCI_CODES, millesime: '2021' } },
  'DemographicEvolutionController.getDemographicEvolution': { query: { epciCodes: EPCI_CODES, millesime: '2021' } },
  'DemographicEvolutionController.getEpcisWithoutInseeProjection': { query: { epciCodes: EPCI_CODES } },
  'DemographicEvolutionController.getPopulationDemographicEvolution': { query: { epciCodes: EPCI_CODES, millesime: '2021' } },
  'DocurbaController.getBatchForEpcis': { query: { codes: EPCI_CODES } },
  'DocurbaController.getForEpci': { param: { code: '200069672' } },
  'PreviewController.preview': { body: withoutCustomEvolutions },
  'PreviewController.previewForSimulation': { body: withoutCustomEvolutions },
  'ExportPowerpointController.requestPowerpoint': {
    body: {
      documentType: 'PLUi',
      epci: { code: '200069672', name: 'CA Le Grand Chalon' },
      nextStep: 'Arrêt du projet',
      periodEnd: '2035',
      periodStart: '2025',
      privilegedSimulation: 'sim-1',
      privilegedSimulationProjection: 2,
      // Le schéma refuse une date passée : une date lointaine garde le snapshot stable.
      resultDate: '2099-12-31',
      selectedSimulations: ['sim-1'],
    },
  },
}

type InputKind = 'body' | 'query' | 'param'
type Schema = { _zod: { def: Record<string, any> } }
type RouteInput = { kind: InputKind; schema: Schema }
type Route = {
  controller: Type<unknown>
  method: string
  verb: string
  path: string
  inputs: RouteInput[]
}

const KIND_BY_PARAMTYPE: Partial<Record<number, InputKind>> = {
  [RouteParamtypes.BODY]: 'body',
  [RouteParamtypes.QUERY]: 'query',
  [RouteParamtypes.PARAM]: 'param',
}

const controllerFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return controllerFiles(path)
    return entry.endsWith('.controller.ts') ? [path] : []
  })

const joinPath = (...parts: (string | undefined)[]): string =>
  `/${parts
    .flatMap((part) => (part ?? '').split('/'))
    .filter(Boolean)
    .join('/')}`

/** Le schéma posé sur le paramètre, quelle que soit la façon de l'y attacher. */
const schemaOf = (meta: { schema?: Schema }, paramtype: unknown): Schema | undefined =>
  meta.schema ?? (paramtype as { schema?: Schema } | undefined)?.schema

function discoverRoutes(): Route[] {
  const routes: Route[] = []
  for (const file of controllerFiles(SRC).sort()) {
    for (const exported of Object.values(require(file))) {
      if (typeof exported !== 'function' || !Reflect.hasMetadata(PATH_METADATA, exported)) continue
      const controller = exported as Type<unknown>
      const controllerPath = [Reflect.getMetadata(PATH_METADATA, controller)].flat()[0] as string

      for (const method of Object.getOwnPropertyNames(controller.prototype).sort()) {
        const handler = controller.prototype[method]
        if (method === 'constructor' || !Reflect.hasMetadata(PATH_METADATA, handler)) continue

        const args: Record<string, { index: number; data?: unknown; schema?: Schema }> =
          Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, method) ?? {}
        const paramtypes: unknown[] = Reflect.getMetadata('design:paramtypes', controller.prototype, method) ?? []

        const inputs = Object.entries(args).flatMap(([key, meta]) => {
          const kind = KIND_BY_PARAMTYPE[Number(key.split(':')[0])]
          if (!kind || meta.data !== undefined) return []
          const schema = schemaOf(meta, paramtypes[meta.index])
          return schema ? [{ kind, schema }] : []
        })
        if (inputs.length === 0) continue

        const verb = RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod].toLowerCase()
        const methodPath = [Reflect.getMetadata(PATH_METADATA, handler)].flat()[0] as string
        routes.push({ controller, method, verb, path: joinPath(controllerPath, methodPath), inputs })
      }
    }
  }
  return routes
}

/** Sérialise en marquant les dates : une `Date` et une chaîne ISO ne sont pas le même contrat. */
function normalize(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, function (this: Record<string, unknown>, key, current) {
        const raw = this[key]
        return raw instanceof Date ? { $date: raw.toISOString() } : current
      }),
    )
  } catch {
    return '[non sérialisable]'
  }
}

type Call = { fn: string; args: unknown }

const IGNORED_MEMBERS = new Set([
  'then',
  'constructor',
  'toJSON',
  'onModuleInit',
  'onApplicationBootstrap',
  'onModuleDestroy',
  'beforeApplicationShutdown',
  'onApplicationShutdown',
])

/** Doublure qui répond à toute méthode et enregistre ses appels. */
function recordingMock(owner: string, calls: Call[]): unknown {
  return new Proxy(
    {},
    {
      get: (_target, member) => {
        if (typeof member === 'symbol' || IGNORED_MEMBERS.has(member)) return undefined
        const fn = `${owner}.${member}`
        return (...args: unknown[]) => {
          calls.push({ fn, args: normalize(args) })
          return Promise.resolve({ mocked: fn })
        }
      },
    },
  )
}

const allowAll: CanActivate = { canActivate: () => true }

function guardsOf(route: Route): Type<CanActivate>[] {
  const guards = [
    ...(Reflect.getMetadata(GUARDS_METADATA, route.controller) ?? []),
    ...(Reflect.getMetadata(GUARDS_METADATA, route.controller.prototype[route.method]) ?? []),
  ]
  return guards.filter((guard): guard is Type<CanActivate> => typeof guard === 'function')
}

/** Valeur que porterait la même donnée dans une chaîne de requête. */
function toQueryValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => toQueryValue(item))
  if (value instanceof Date) return value.toISOString()
  if (value !== null && typeof value === 'object') return JSON.stringify(value)
  return value === undefined ? undefined : String(value)
}

function toQuery(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toQueryValue(item)]))
}

function wrongTypeFor(value: unknown, kind: InputKind): unknown {
  if (kind !== 'body') return 'zz-invalid-zz'
  if (typeof value === 'string') return 12345
  if (typeof value === 'number') return 'not-a-number'
  if (typeof value === 'boolean') return 'not-a-boolean'
  return 'not-an-object'
}

type Scenario = { name: string; input: unknown }

function validInputFor(route: Route, input: RouteInput): unknown {
  const generated = normalize(zodSample(input.schema, 'full'))
  const manual = VALID_INPUTS[`${route.controller.name}.${route.method}`]?.[input.kind]
  if (manual === undefined) return generated
  return typeof manual === 'function' ? manual(generated as Record<string, unknown>) : manual
}

function scenariosFor(route: Route, input: RouteInput): Scenario[] {
  const sample = (mode: SampleMode) => normalize(zodSample(input.schema, mode))
  const valid = validInputFor(route, input)
  const scenarios: Scenario[] = [
    { name: 'exemple valide', input: valid },
    { name: 'exemple minimal', input: sample('minimal') },
    { name: 'objet vide', input: {} },
  ]

  if (valid !== null && typeof valid === 'object' && !Array.isArray(valid)) {
    scenarios.push({ name: 'clé inconnue ajoutée', input: { ...valid, __unknown__: 'x' } })
    for (const key of Object.keys(valid).sort()) {
      const { [key]: omitted, ...rest } = valid as Record<string, unknown>
      scenarios.push({ name: `sans « ${key} »`, input: rest })
      scenarios.push({ name: `« ${key} » de type faux`, input: { ...rest, [key]: wrongTypeFor(omitted, input.kind) } })
    }
  }
  return scenarios
}

/** Remplit les segments `:nom` du chemin, avec le paramètre validé s'il y en a un. */
function resolvePath(path: string, params: unknown): string {
  return path.replace(/:(\w+)/g, (_match, name: string) => {
    const value = params !== null && typeof params === 'object' ? (params as Record<string, unknown>)[name] : undefined
    return encodeURIComponent(value === undefined ? `${name}-test` : String(toQueryValue(value)))
  })
}

/** Clés triées : l'ordre interne d'une bibliothèque ne fait pas partie du contrat. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
  )
}

/** Résultat d'un appel, figé sur une ligne JSON : un snapshot par scénario, lisible en diff. */
class ContractResult {
  constructor(readonly data: { status: number; body: unknown; calls: Call[] }) {}
}

expect.addSnapshotSerializer({
  test: (value) => value instanceof ContractResult,
  serialize: (value: ContractResult) => JSON.stringify(sortKeys(value.data)),
})

const routes = discoverRoutes()

describe("Contrat d'entrée des routes validées", () => {
  it('should discover the validated routes', () => {
    expect(routes.map((route) => `${route.verb.toUpperCase()} ${route.path} → ${route.controller.name}.${route.method}`)).toMatchSnapshot()
  })

  describe.each(routes.map((route) => [`${route.controller.name}.${route.method}`, route] as const))('%s', (_label, route) => {
    let app: INestApplication
    const calls: Call[] = []

    beforeAll(async () => {
      app = await createHttpTestApp({ controllers: [route.controller] }, USER, {
        request: { apiConsumer: API_CONSUMER },
        configure: (builder) => {
          const configured = guardsOf(route).reduce((current, guard) => current.overrideGuard(guard).useValue(allowAll), builder)
          // `Object` est le type réfléchi d'un paramètre optionnel non typé, celui du pipe de
          // validation compris : le doubler remplacerait la validation par la doublure.
          return configured.useMocker((token) =>
            token === Object ? undefined : recordingMock(typeof token === 'function' ? token.name : String(token), calls),
          )
        },
      })
    })

    afterAll(async () => {
      await app.close()
    })

    const defaults = Object.fromEntries(route.inputs.map((input) => [input.kind, validInputFor(route, input)])) as Partial<
      Record<InputKind, unknown>
    >

    const send = async (inputs: Partial<Record<InputKind, unknown>>) => {
      calls.length = 0
      const server = app.getHttpServer()
      const url = resolvePath(route.path, inputs.param)
      let pending = (request(server) as unknown as Record<string, (url: string) => request.Test>)[route.verb](url)
      if (inputs.query !== undefined) pending = pending.query(toQuery(inputs.query))
      if (inputs.body !== undefined) pending = pending.send(inputs.body as object)
      const response = await pending
      return new ContractResult({ status: response.status, body: response.body, calls: [...calls] })
    }

    for (const input of route.inputs) {
      for (const scenario of scenariosFor(route, input)) {
        it(`${input.kind} — ${scenario.name}`, async () => {
          expect(await send({ ...defaults, [input.kind]: scenario.input })).toMatchSnapshot()
        })
      }
    }

    /** Sans cette vérification, une route pourrait ne jamais être exercée qu'en échec. */
    it('should let the valid example through validation', async () => {
      const { status } = (await send(defaults)).data
      expect(status).not.toBe(400)
    })
  })
})
