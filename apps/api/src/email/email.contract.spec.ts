import { createMock } from '@golevelup/ts-jest'
import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHttpTestApp } from '@test/http-app'
import request from 'supertest'
import { EmailController } from './email.controller'
import { EmailService } from './email.service'

// Le paquet est distribué en ESM, que le runtime CommonJS de Jest ne sait pas charger.
jest.mock('@thallesp/nestjs-better-auth', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  AllowAnonymous: () => () => {},
}))

/** Contrat du formulaire de contact, seul point d'écriture ouvert sans compte. */
describe('EmailController (contrat HTTP)', () => {
  let app: INestApplication
  let emailService: jest.Mocked<EmailService>

  /**
   * Le corps que `use-contact-form.ts` envoie, `consent` compris : ce champ n'existe pas
   * dans le schéma de l'API et doit continuer à être ignoré.
   */
  const REAL_PAYLOAD = {
    consent: true,
    email: 'agent@ddt71.gouv.fr',
    firstname: 'Agnès',
    lastname: 'Martin',
    message: "Bonjour, j'aimerais comprendre le calcul du besoin en logements.",
    subject: 'Question sur les résultats',
  }

  const sentHtml = () => (emailService.sendEmail.mock.calls[0][0] as { html: string }).html

  beforeEach(async () => {
    emailService = createMock<EmailService>()
    app = await createHttpTestApp({
      controllers: [EmailController],
      providers: [
        { provide: EmailService, useValue: emailService },
        { provide: ConfigService, useValue: { getOrThrow: () => 'equipe@otelo.test' } },
      ],
    })
  })

  afterEach(async () => {
    await app.close()
  })

  it('should accept the payload the contact form sends today', async () => {
    const response = await request(app.getHttpServer()).post('/email/contact').send(REAL_PAYLOAD)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ success: true, message: 'Email envoyé avec succès' })
    expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
  })

  it('should keep ignoring the consent field the form adds', async () => {
    await request(app.getHttpServer()).post('/email/contact').send(REAL_PAYLOAD)

    expect(sentHtml()).not.toContain('consent')
  })

  describe('échappement du courriel', () => {
    /** Le courriel part depuis l'adresse légitime d'Otelo, SPF et DKIM valides. */
    it('should neutralise HTML a visitor puts in the message', async () => {
      await request(app.getHttpServer())
        .post('/email/contact')
        .send({ ...REAL_PAYLOAD, message: '<a href="https://hameconnage.test">Cliquez ici</a>' })

      const html = sentHtml()
      expect(html).not.toContain('<a href')
      expect(html).toContain('&lt;a href=')
    })

    it('should neutralise HTML in every field, not only the message', async () => {
      await request(app.getHttpServer())
        .post('/email/contact')
        .send({ ...REAL_PAYLOAD, firstname: '<img src=x>', lastname: '<b>gras</b>', subject: '<h1>Urgent</h1>' })

      const html = sentHtml()
      expect(html).not.toContain('<img')
      expect(html).not.toContain('<b>')
      expect(html).not.toContain('<h1>Urgent')
    })

    /** On échappe, on ne mutile pas. */
    it('should leave ordinary French text readable', async () => {
      await request(app.getHttpServer()).post('/email/contact').send(REAL_PAYLOAD)

      const html = sentHtml()
      expect(html).toContain('Agnès')
      expect(html).toContain('besoin en logements')
    })
  })

  describe('bornes du formulaire', () => {
    it('should refuse a message longer than any human request', async () => {
      const response = await request(app.getHttpServer())
        .post('/email/contact')
        .send({ ...REAL_PAYLOAD, message: 'a'.repeat(5001) })

      expect(response.status).toBe(400)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should refuse an address that is not one', async () => {
      const response = await request(app.getHttpServer())
        .post('/email/contact')
        .send({ ...REAL_PAYLOAD, email: 'pas-une-adresse' })

      expect(response.status).toBe(400)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should refuse a body with nothing in it', async () => {
      const response = await request(app.getHttpServer()).post('/email/contact').send({})

      expect(response.status).toBe(400)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should refuse a field that is not a string', async () => {
      const response = await request(app.getHttpServer())
        .post('/email/contact')
        .send({ ...REAL_PAYLOAD, firstname: { toString: 'malin' } })

      expect(response.status).toBe(400)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })
  })
})
