import { createMock } from '@golevelup/ts-jest'
import { INestApplication } from '@nestjs/common'
import { createHttpTestApp } from '@test/http-app'
import request from 'supertest'
import { DocurbaController } from './docurba.controller'
import { DocurbaService } from './docurba.service'

// Paquet ESM, que le runtime CommonJS de Jest ne sait pas charger.
jest.mock('@thallesp/nestjs-better-auth', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  AllowAnonymous: () => () => {},
}))

/**
 * Un test de schéma prouve que le `z.object` rejette ; il ne prouve pas que le pipe s'en
 * saisit. Seul un aller-retour HTTP fait la différence.
 */
describe('DocurbaController (contrat HTTP)', () => {
  let app: INestApplication
  let service: jest.Mocked<DocurbaService>

  const RESULT = {
    approvalYear: '2019',
    communeCode: '71076',
    documentType: 'PLUi',
    planningDocuments: [],
    procedureInProgress: null,
    scotName: 'SCoT du Chalonnais',
  }

  beforeEach(async () => {
    service = createMock<DocurbaService>()
    service.getForEpci.mockResolvedValue(RESULT)
    app = await createHttpTestApp({
      controllers: [DocurbaController],
      providers: [{ provide: DocurbaService, useValue: service }],
    })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /docurba/epcis', () => {
    it('should answer the comma-separated list the territory screen sends', async () => {
      const response = await request(app.getHttpServer()).get('/docurba/epcis').query({ codes: '200069672,200040590' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ '200040590': RESULT, '200069672': RESULT })
    })

    it('should refuse more codes than a territory can hold', async () => {
      const codes = Array.from({ length: 51 }, (_, i) => String(200_000_000 + i)).join(',')

      const response = await request(app.getHttpServer()).get('/docurba/epcis').query({ codes })

      expect(response.status).toBe(400)
      expect(service.getForEpci).not.toHaveBeenCalled()
    })

    /** Chaque code inconnu devient une clé de cache et un appel sortant. */
    it('should refuse a code that is not a SIREN', async () => {
      const response = await request(app.getHttpServer()).get('/docurba/epcis').query({ codes: '200069672,../../etc/passwd' })

      expect(response.status).toBe(400)
      expect(service.getForEpci).not.toHaveBeenCalled()
    })

    it('should refuse a request with no code at all', async () => {
      const response = await request(app.getHttpServer()).get('/docurba/epcis')

      expect(response.status).toBe(400)
      expect(service.getForEpci).not.toHaveBeenCalled()
    })
  })

  describe('GET /docurba/epci/:code', () => {
    it('should answer for a valid code', async () => {
      const response = await request(app.getHttpServer()).get('/docurba/epci/200069672')

      expect(response.status).toBe(200)
      expect(service.getForEpci).toHaveBeenCalledWith('200069672')
    })

    it('should refuse a code that is not a SIREN', async () => {
      const response = await request(app.getHttpServer()).get('/docurba/epci/pas-un-siren')

      expect(response.status).toBe(400)
      expect(service.getForEpci).not.toHaveBeenCalled()
    })
  })
})
