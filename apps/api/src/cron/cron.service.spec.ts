import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { of } from 'rxjs'
import { PrismaService } from '~/db/prisma.service'
import { CronService } from './cron.service'
import { DossierNode } from './interfaces/demarches-simplifiees.interface'

describe('CronService', () => {
  let service: CronService
  let httpService: { post: jest.Mock }
  let prisma: { user: { updateMany: jest.Mock } }

  beforeEach(async () => {
    httpService = { post: jest.fn() }
    prisma = { user: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) } }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        { provide: HttpService, useValue: httpService },
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                DEMARCHES_SIMPLIFIEES_URL: 'https://api.test.com/graphql',
                DEMARCHES_SIMPLIFIEES_TOKEN: 'test-token',
                DEMARCHES_SIMPLIFIEES_DEMARCHE_ID: '123',
              }
              return config[key]
            }),
          },
        },
      ],
    }).compile()

    service = module.get<CronService>(CronService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('extractEmailsFromDossier', () => {
    it('should extract usager email', () => {
      const dossier: DossierNode = {
        id: '1',
        state: 'accepte',
        dateDepot: '2024-01-01',
        dateDerniereModification: '2024-01-01',
        usager: { email: 'user@test.com' },
        champs: [],
      }
      const result = (service as any).extractEmailsFromDossier(dossier)
      expect(result).toEqual(['user@test.com'])
    })

    it('should extract email from Adresse email champ', () => {
      const dossier: DossierNode = {
        id: '1',
        state: 'accepte',
        dateDepot: '2024-01-01',
        dateDerniereModification: '2024-01-01',
        usager: { email: 'user@test.com' },
        champs: [{ id: '2', label: 'Adresse email', value: 'referent@test.com' }],
      }
      const result = (service as any).extractEmailsFromDossier(dossier)
      expect(result).toContain('user@test.com')
      expect(result).toContain('referent@test.com')
    })

    it('should extract emails from repetition champ', () => {
      const dossier: DossierNode = {
        id: '1',
        state: 'accepte',
        dateDepot: '2024-01-01',
        dateDerniereModification: '2024-01-01',
        usager: { email: 'user@test.com' },
        champs: [
          {
            id: '3',
            label: 'Adresses email des utilisateurs au sein de votre structure (en plus du référent Otelo)',
            champs: [
              { id: '4', label: 'Email', value: 'extra1@test.com' },
              { id: '5', label: 'Email', value: 'extra2@test.com' },
            ],
          },
        ],
      }
      const result = (service as any).extractEmailsFromDossier(dossier)
      expect(result).toContain('extra1@test.com')
      expect(result).toContain('extra2@test.com')
    })

    it('should parse comma-separated emails from text field', () => {
      const dossier: DossierNode = {
        id: '1',
        state: 'accepte',
        dateDepot: '2024-01-01',
        dateDerniereModification: '2024-01-01',
        usager: { email: 'user@test.com' },
        champs: [
          {
            id: '3',
            label: 'Adresses email des utilisateurs au sein de votre structure (en plus du référent Otelo)',
            value: 'a@test.com, b@test.com; c@test.com',
          },
        ],
      }
      const result = (service as any).extractEmailsFromDossier(dossier)
      expect(result).toContain('a@test.com')
      expect(result).toContain('b@test.com')
      expect(result).toContain('c@test.com')
    })

    it('should deduplicate emails', () => {
      const dossier: DossierNode = {
        id: '1',
        state: 'accepte',
        dateDepot: '2024-01-01',
        dateDerniereModification: '2024-01-01',
        usager: { email: 'user@test.com' },
        champs: [{ id: '2', label: 'Adresse email', value: 'user@test.com' }],
      }
      const result = (service as any).extractEmailsFromDossier(dossier)
      expect(result).toHaveLength(1)
    })

    it('should filter out invalid emails (no @)', () => {
      const dossier: DossierNode = {
        id: '1',
        state: 'accepte',
        dateDepot: '2024-01-01',
        dateDerniereModification: '2024-01-01',
        usager: { email: 'user@test.com' },
        champs: [
          {
            id: '3',
            label: 'Adresses email des utilisateurs au sein de votre structure (en plus du référent Otelo)',
            value: 'notanemail, valid@test.com',
          },
        ],
      }
      const result = (service as any).extractEmailsFromDossier(dossier)
      expect(result).not.toContain('notanemail')
      expect(result).toContain('valid@test.com')
    })
  })

  describe('processDossiersPage', () => {
    it('should collect emails only from accepted dossiers', () => {
      const nodes: DossierNode[] = [
        {
          id: '1',
          state: 'accepte',
          dateDepot: '2024-01-01',
          dateDerniereModification: '2024-01-01',
          usager: { email: 'accepted@test.com' },
          champs: [],
        },
        {
          id: '2',
          state: 'refuse',
          dateDepot: '2024-01-01',
          dateDerniereModification: '2024-01-01',
          usager: { email: 'refused@test.com' },
          champs: [],
        },
        {
          id: '3',
          state: 'en_construction',
          dateDepot: '2024-01-01',
          dateDerniereModification: '2024-01-01',
          usager: { email: 'pending@test.com' },
          champs: [],
        },
      ]
      const acceptedEmails = new Set<string>()
      ;(service as any).processDossiersPage(nodes, acceptedEmails)
      expect(acceptedEmails.has('accepted@test.com')).toBe(true)
      expect(acceptedEmails.has('refused@test.com')).toBe(false)
      expect(acceptedEmails.has('pending@test.com')).toBe(false)
    })

    it('should lowercase all emails', () => {
      const nodes: DossierNode[] = [
        {
          id: '1',
          state: 'accepte',
          dateDepot: '2024-01-01',
          dateDerniereModification: '2024-01-01',
          usager: { email: 'User@Test.COM' },
          champs: [],
        },
      ]
      const acceptedEmails = new Set<string>()
      ;(service as any).processDossiersPage(nodes, acceptedEmails)
      expect(acceptedEmails.has('user@test.com')).toBe(true)
    })
  })

  describe('updateUserAccess', () => {
    it('should update users matching accepted emails', async () => {
      prisma.user.updateMany = jest.fn().mockResolvedValue({ count: 2 })
      const emails = new Set(['a@test.com', 'b@test.com'])

      await (service as any).updateUserAccess(emails)

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          AND: [{ email: { in: ['a@test.com', 'b@test.com'] }, engaged: false }],
        },
        data: { engaged: true, hasAccess: true },
      })
    })

    it('should skip update when no accepted emails', async () => {
      const emails = new Set<string>()
      await (service as any).updateUserAccess(emails)
      expect(prisma.user.updateMany).not.toHaveBeenCalled()
    })

    it('should propagate errors from prisma', async () => {
      prisma.user.updateMany = jest.fn().mockRejectedValue(new Error('DB error'))
      const emails = new Set(['a@test.com'])
      await expect((service as any).updateUserAccess(emails)).rejects.toThrow('DB error')
    })
  })

  describe('handleUserAccessUpdate', () => {
    it('should process dossiers and update user access', async () => {
      httpService.post.mockReturnValue(
        of({
          data: {
            data: {
              demarche: {
                id: '1',
                title: 'Test',
                dossiers: {
                  pageInfo: { hasPreviousPage: false, hasNextPage: false, startCursor: 'a', endCursor: 'b' },
                  nodes: [
                    {
                      id: '1',
                      state: 'accepte',
                      dateDepot: '2024-01-01',
                      dateDerniereModification: '2024-01-01',
                      usager: { email: 'user@test.com' },
                      champs: [],
                    },
                  ],
                },
              },
            },
          },
        }),
      )
      prisma.user.updateMany = jest.fn().mockResolvedValue({ count: 1 })

      await service.handleUserAccessUpdate()

      expect(httpService.post).toHaveBeenCalled()
      expect(prisma.user.updateMany).toHaveBeenCalled()
    })
  })
})
