import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MainModule } from '~/main.module'
import { createExternalDocument, createInternalDocument } from '~/openapi'

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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [MainModule] }).compile()
    app = moduleRef.createNestApplication({ logger: false })
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should keep the external API contract unchanged', () => {
    expect(createExternalDocument(app)).toMatchSnapshot()
  })

  /** Il échouait sur `z.date()`, et `/swagger-json` répondait 500. */
  it('should generate the internal API document', () => {
    expect(createInternalDocument(app)).toMatchSnapshot()
  })
})
