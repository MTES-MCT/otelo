import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'

// `test/jest-setup.ts` remplace better-auth par une doublure : le module réel est requis ici.
jest.unmock('~/auth/better-auth')

/**
 * Contrat publié de l'API externe : le document OpenAPI que reçoivent les consommateurs.
 *
 * L'application complète est montée, comme en production, pour que le document reflète
 * exactement les modules, décorateurs et convertisseurs réellement chargés. Le snapshot est
 * le contrat : toute différence est une rupture pour les intégrations existantes.
 */
describe('Document OpenAPI (intégration)', () => {
  let app: INestApplication
  let createExternalDocument: typeof import('~/openapi').createExternalDocument
  let createInternalDocument: typeof import('~/openapi').createInternalDocument

  beforeAll(async () => {
    /**
     * better-auth lance la découverte OIDC de ProConnect dès sa création, en tâche de fond.
     * L'émetteur de test n'existe pas : selon la résolution DNS de la machine, l'échec arrivait
     * avant ou après la fin des tests, et un log tardif fait échouer jest. On la fait échouer
     * tout de suite, sans réseau, avant de charger better-auth, puis on attend son initialisation.
     */
    const issuer = process.env.OAUTH_PROCONNECT_ISSUER as string
    const realFetch = globalThis.fetch
    jest.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      return url.startsWith(issuer) ? Promise.reject(new TypeError('fetch failed')) : realFetch(input, init)
    })

    const { auth } = await import('~/auth/better-auth')
    await auth.$context
    ;({ createExternalDocument, createInternalDocument } = await import('~/openapi'))
    const { MainModule } = await import('~/main.module')

    const moduleRef = await Test.createTestingModule({ imports: [MainModule] }).compile()
    app = moduleRef.createNestApplication({ logger: false })
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
    jest.restoreAllMocks()
  })

  it('should keep the external API contract unchanged', () => {
    expect(createExternalDocument(app)).toMatchSnapshot()
  })

  /**
   * Il échouait sur `z.date()`, et `/swagger-json` répondait 500. Sans consommateur externe,
   * seul l'inventaire des routes documentées est figé, pas le détail des schémas.
   */
  it('should generate the internal API document', () => {
    const { paths } = createInternalDocument(app)
    const operations = Object.entries(paths).flatMap(([path, item]) =>
      Object.keys(item)
        .filter((key) => ['get', 'post', 'put', 'patch', 'delete'].includes(key))
        .map((method) => `${method.toUpperCase()} ${path}`),
    )
    expect(operations.sort()).toMatchSnapshot()
  })
})
