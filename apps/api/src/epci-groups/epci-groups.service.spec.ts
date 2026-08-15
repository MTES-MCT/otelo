import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { EpciGroupsService } from './epci-groups.service'

describe('EpciGroupsService', () => {
  let service: EpciGroupsService
  let mockPrismaService: DeepMocked<PrismaService>

  beforeEach(async () => {
    mockPrismaService = createMock<PrismaService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [EpciGroupsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile()

    service = module.get<EpciGroupsService>(EpciGroupsService)
  })

  describe('create', () => {
    beforeEach(() => {
      mockPrismaService.epciGroup.create = jest.fn().mockResolvedValue({ id: 'group-1' })
    })

    it.each([
      [true, true],
      [false, false],
    ])('should persist worksOnPlanningDocument=%s', async (answer, expected) => {
      await service.create('user-1', { name: 'SCoT du Grand Périgueux', epciCodes: ['200040392'], worksOnPlanningDocument: answer })

      expect(mockPrismaService.epciGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ worksOnPlanningDocument: expected }) }),
      )
    })

    it('should store null when the question was not answered', async () => {
      await service.create('user-1', { name: 'CA Le Grand Périgueux', epciCodes: ['200040392'] })

      expect(mockPrismaService.epciGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ worksOnPlanningDocument: null }) }),
      )
    })

    it('should persist the planning document type and name', async () => {
      await service.create('user-1', {
        name: 'PLUiH — CA Seine-Eure',
        epciCodes: ['200089456'],
        worksOnPlanningDocument: true,
        planningDocumentType: 'PLH_PLUI',
        planningDocumentName: 'PLUiH — CA Seine-Eure',
      })

      expect(mockPrismaService.epciGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ planningDocumentType: 'PLH_PLUI', planningDocumentName: 'PLUiH — CA Seine-Eure' }),
        }),
      )
    })

    it('should not keep a document type when the user does not work on a planning document', async () => {
      await service.create('user-1', {
        name: 'CA Le Grand Périgueux',
        epciCodes: ['200040392'],
        worksOnPlanningDocument: false,
        planningDocumentType: 'SCOT',
        planningDocumentName: 'SCoT du Grand Périgueux',
      })

      expect(mockPrismaService.epciGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ planningDocumentType: null, planningDocumentName: null }) }),
      )
    })
  })

  describe('markWorksOnPlanningDocument', () => {
    beforeEach(() => {
      mockPrismaService.epciGroup.updateMany = jest.fn().mockResolvedValue({ count: 1 })
    })

    it('should only ever set the flag to true, scoped to the owner', async () => {
      await service.markWorksOnPlanningDocument('group-1', 'user-1')

      expect(mockPrismaService.epciGroup.updateMany).toHaveBeenCalledWith({
        where: { id: 'group-1', userId: 'user-1', deleted: null },
        data: { worksOnPlanningDocument: true },
      })
    })

    it('should record the document the user just declared', async () => {
      await service.markWorksOnPlanningDocument('group-1', 'user-1', {
        planningDocumentType: 'PLH_PLUI',
        planningDocumentName: 'PLUi — CC Usses et Rhône',
      })

      expect(mockPrismaService.epciGroup.updateMany).toHaveBeenCalledWith({
        where: { id: 'group-1', userId: 'user-1', deleted: null },
        data: {
          worksOnPlanningDocument: true,
          planningDocumentType: 'PLH_PLUI',
          planningDocumentName: 'PLUi — CC Usses et Rhône',
        },
      })
    })

    it('should leave a previously recorded document untouched when none is declared', async () => {
      await service.markWorksOnPlanningDocument('group-1', 'user-1', { planningDocumentType: 'SCOT', planningDocumentName: null })

      expect(mockPrismaService.epciGroup.updateMany).toHaveBeenCalledWith({
        where: { id: 'group-1', userId: 'user-1', deleted: null },
        data: { worksOnPlanningDocument: true, planningDocumentType: 'SCOT' },
      })
    })
  })
})
