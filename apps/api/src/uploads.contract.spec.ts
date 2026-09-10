import { createMock } from '@golevelup/ts-jest'
import { INestApplication } from '@nestjs/common'
import { createHttpTestApp } from '@test/http-app'
import request from 'supertest'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { DemographicEvolutionCustomController } from '~/demographic-evolution-custom/demographic-evolution-custom.controller'
import { DemographicEvolutionCustomService } from '~/demographic-evolution-custom/demographic-evolution-custom.service'
import { UsersController } from '~/users/users.controller'
import { UsersService } from '~/users/users.service'

/**
 * Les deux seuls points qui instancient `multer`, dont la version est forcée par un
 * `pnpm.overrides` : on sort du couple testé par l'amont, ces tests l'attestent.
 */
describe('Import de fichiers (contrat HTTP)', () => {
  const CSV = 'email;nom;prenom\nagent@ddt71.gouv.fr;Martin;Agnès\n'

  describe('POST /users/import/csv', () => {
    let app: INestApplication
    let usersService: jest.Mocked<UsersService>

    beforeEach(async () => {
      usersService = createMock<UsersService>()
      app = await createHttpTestApp({
        controllers: [UsersController],
        providers: [{ provide: UsersService, useValue: usersService }],
      })
    })

    afterEach(async () => {
      await app.close()
    })

    it('should accept the CSV the admin screen sends', async () => {
      usersService.importUsersFromCsv.mockResolvedValue({ created: 1, skipped: 0 } as never)

      const response = await request(app.getHttpServer())
        .post('/users/import/csv')
        .attach('file', Buffer.from(CSV), { contentType: 'text/csv', filename: 'utilisateurs.csv' })

      expect(response.status).toBe(200)
      // Atteste que multer a remis le contenu intact, accents compris.
      expect(usersService.importUsersFromCsv).toHaveBeenCalledWith([
        expect.objectContaining({ email: 'agent@ddt71.gouv.fr', firstname: 'Agnès', lastname: 'Martin' }),
      ])
    })

    it('should refuse a request carrying no file', async () => {
      const response = await request(app.getHttpServer()).post('/users/import/csv')

      expect(response.status).toBe(400)
      expect(usersService.importUsersFromCsv).not.toHaveBeenCalled()
    })

    /** Le plafond est tenu par multer : c'est ce qu'une montée de version casse sans bruit. */
    it('should refuse a file past the 10 MB ceiling', async () => {
      const tooBig = Buffer.alloc(10 * 1024 * 1024 + 1, 'a')

      const response = await request(app.getHttpServer())
        .post('/users/import/csv')
        .attach('file', tooBig, { contentType: 'text/csv', filename: 'gros.csv' })

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(usersService.importUsersFromCsv).not.toHaveBeenCalled()
    })

    it('should refuse a file that does not claim to be a CSV', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/import/csv')
        .attach('file', Buffer.from('%PDF-1.4'), { contentType: 'application/pdf', filename: 'doc.pdf' })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /demographic-evolution-custom/upload', () => {
    let app: INestApplication
    let service: jest.Mocked<DemographicEvolutionCustomService>

    beforeEach(async () => {
      service = createMock<DemographicEvolutionCustomService>()
      app = await createHttpTestApp({
        controllers: [DemographicEvolutionCustomController],
        providers: [
          { provide: DemographicEvolutionCustomService, useValue: service },
          { provide: DataPackVersionsService, useValue: createMock<DataPackVersionsService>() },
        ],
      })
    })

    afterEach(async () => {
      await app.close()
    })

    /** `epciCode` voyage dans le même corps multipart : fichier et champs texte à la fois. */
    it('should accept the file and the fields the upload screen sends together', async () => {
      service.parseUploadedFile.mockResolvedValue([{ year: 2030, value: 1000 }] as never)
      service.upsert.mockResolvedValue({ id: 'dec-1' } as never)

      const response = await request(app.getHttpServer())
        .post('/demographic-evolution-custom/upload')
        .field('epciCode', '200069672')
        .attach('file', Buffer.from('annee;population\n2030;1000\n'), {
          contentType: 'text/csv',
          filename: 'projection.csv',
        })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({ id: 'dec-1' })
      expect(service.upsert).toHaveBeenCalledWith('user-test', expect.objectContaining({ epciCode: '200069672' }))
    })

    it('should refuse a request carrying no file', async () => {
      const response = await request(app.getHttpServer()).post('/demographic-evolution-custom/upload').field('epciCode', '200069672')

      expect(response.status).toBe(400)
      expect(service.upsert).not.toHaveBeenCalled()
    })

    it('should refuse a file without the EPCI it belongs to', async () => {
      const response = await request(app.getHttpServer())
        .post('/demographic-evolution-custom/upload')
        .attach('file', Buffer.from('annee;population\n2030;1000\n'), {
          contentType: 'text/csv',
          filename: 'projection.csv',
        })

      expect(response.status).toBe(400)
      expect(service.upsert).not.toHaveBeenCalled()
    })

    it('should refuse a file past the 10 MB ceiling', async () => {
      const tooBig = Buffer.alloc(10 * 1024 * 1024 + 1, 'a')

      const response = await request(app.getHttpServer())
        .post('/demographic-evolution-custom/upload')
        .field('epciCode', '200069672')
        .attach('file', tooBig, { contentType: 'text/csv', filename: 'gros.csv' })

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(service.upsert).not.toHaveBeenCalled()
    })

    /** Le refus vient du `fileFilter`, donc avant que le fichier soit lu en mémoire. */
    it('should refuse a file that does not claim to be a CSV, before reading it', async () => {
      const response = await request(app.getHttpServer())
        .post('/demographic-evolution-custom/upload')
        .field('epciCode', '200069672')
        .attach('file', Buffer.from('%PDF-1.4'), { contentType: 'application/pdf', filename: 'doc.pdf' })

      expect(response.status).toBe(400)
      expect(service.parseUploadedFile).not.toHaveBeenCalled()
      expect(service.upsert).not.toHaveBeenCalled()
    })
  })
})
