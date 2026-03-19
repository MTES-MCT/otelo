import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { SimulationEventsService } from '~/simulations/simulation-events.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'
import { CollaborationService } from './collaboration.service'

describe('CollaborationService', () => {
  let service: CollaborationService
  let mockPrisma: DeepMocked<PrismaService>
  let mockUsersService: DeepMocked<UsersService>
  let mockSimulationsService: DeepMocked<SimulationsService>
  let mockEventsService: DeepMocked<SimulationEventsService>

  const ownerId = 'owner-1'
  const collaboratorId = 'collab-1'
  const simulationId = 'sim-1'

  beforeEach(async () => {
    mockPrisma = createMock<PrismaService>()
    mockUsersService = createMock<UsersService>()
    mockSimulationsService = createMock<SimulationsService>()
    mockEventsService = createMock<SimulationEventsService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: SimulationsService, useValue: mockSimulationsService },
        { provide: SimulationEventsService, useValue: mockEventsService },
      ],
    }).compile()

    service = module.get<CollaborationService>(CollaborationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getActivityHistory', () => {
    it('should return activity with default limit of 50', async () => {
      const mockActivities = [
        {
          id: 'a1',
          action: 'scenario_updated',
          details: null,
          createdAt: new Date(),
          user: { id: 'u1', firstname: 'Jean', lastname: 'Dupont' },
        },
      ]
      mockPrisma.simulationActivity.findMany = jest.fn().mockResolvedValue(mockActivities)

      const result = await service.getActivityHistory(simulationId)

      expect(result).toEqual(mockActivities)
      expect(mockPrisma.simulationActivity.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }))
    })

    it('should cap limit at 100', async () => {
      mockPrisma.simulationActivity.findMany = jest.fn().mockResolvedValue([])

      await service.getActivityHistory(simulationId, 500)

      expect(mockPrisma.simulationActivity.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
    })

    it('should handle NaN limit by defaulting to 50', async () => {
      mockPrisma.simulationActivity.findMany = jest.fn().mockResolvedValue([])

      await service.getActivityHistory(simulationId, NaN)

      expect(mockPrisma.simulationActivity.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }))
    })

    it('should not include email in user select', async () => {
      mockPrisma.simulationActivity.findMany = jest.fn().mockResolvedValue([])

      await service.getActivityHistory(simulationId)

      const call = (mockPrisma.simulationActivity.findMany as jest.Mock).mock.calls[0][0]
      expect(call.select.user.select).not.toHaveProperty('email')
    })
  })

  describe('listCollaborators', () => {
    it('should return collaborators with user email but without inviter email', async () => {
      mockPrisma.simulationCollaborator.findMany = jest.fn().mockResolvedValue([])

      await service.listCollaborators(simulationId)

      const call = (mockPrisma.simulationCollaborator.findMany as jest.Mock).mock.calls[0][0]
      expect(call.select.user.select).toHaveProperty('email')
      expect(call.select.inviter.select).not.toHaveProperty('email')
    })
  })

  describe('inviteByEmail', () => {
    const targetEmail = 'collab@example.com'
    const targetUser = { id: collaboratorId, firstname: 'Marie', lastname: 'Martin', email: targetEmail }

    beforeEach(() => {
      mockPrisma.simulation.findUnique = jest.fn().mockResolvedValue({ userId: ownerId })
      mockUsersService.findByEmail = jest.fn().mockResolvedValue(targetUser)
      mockPrisma.simulationCollaborator.findUnique = jest.fn().mockResolvedValue(null)
      mockPrisma.simulationCollaborator.create = jest.fn().mockResolvedValue({
        id: 'sc-1',
        createdAt: new Date(),
        userId: collaboratorId,
        user: targetUser,
        inviter: { id: ownerId, firstname: 'Jean', lastname: 'Dupont' },
      })
      mockSimulationsService.logActivity = jest.fn().mockResolvedValue(undefined)
    })

    it('should allow owner to invite a user', async () => {
      const result = await service.inviteByEmail(simulationId, ownerId, targetEmail)

      expect(result.userId).toBe(collaboratorId)
      expect(mockPrisma.simulationCollaborator.create).toHaveBeenCalled()
      expect(mockEventsService.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'collaborator_joined', userId: collaboratorId }))
    })

    it('should throw ForbiddenException when non-owner tries to invite', async () => {
      await expect(service.inviteByEmail(simulationId, 'random-user', targetEmail)).rejects.toThrow(ForbiddenException)
    })

    it('should throw NotFoundException when simulation not found', async () => {
      mockPrisma.simulation.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.inviteByEmail(simulationId, ownerId, targetEmail)).rejects.toThrow(NotFoundException)
    })

    it('should throw generic BadRequestException when user not found (no enumeration)', async () => {
      mockUsersService.findByEmail = jest.fn().mockResolvedValue(null)

      await expect(service.inviteByEmail(simulationId, ownerId, 'nonexistent@example.com')).rejects.toThrow(BadRequestException)
      try {
        await service.inviteByEmail(simulationId, ownerId, 'nonexistent@example.com')
      } catch (e) {
        // The error message should be generic — not reveal whether the user exists
        expect((e as BadRequestException).message).toContain("Vérifiez l'email")
      }
    })

    it('should throw generic BadRequestException when user already a collaborator (same message as not found)', async () => {
      mockPrisma.simulationCollaborator.findUnique = jest.fn().mockResolvedValue({ id: 'existing' })

      try {
        await service.inviteByEmail(simulationId, ownerId, targetEmail)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        expect((e as BadRequestException).message).toContain("Vérifiez l'email")
      }
    })

    it('should throw BadRequestException when trying to invite the owner', async () => {
      mockUsersService.findByEmail = jest
        .fn()
        .mockResolvedValue({ id: ownerId, firstname: 'Jean', lastname: 'Dupont', email: 'owner@example.com' })

      await expect(service.inviteByEmail(simulationId, ownerId, 'owner@example.com')).rejects.toThrow(BadRequestException)
    })

    it('should log activity without email in message', async () => {
      await service.inviteByEmail(simulationId, ownerId, targetEmail)

      expect(mockSimulationsService.logActivity).toHaveBeenCalledWith(
        simulationId,
        ownerId,
        'collaborator_invited',
        expect.not.stringContaining('@'),
      )
    })
  })

  describe('removeCollaborator', () => {
    beforeEach(() => {
      mockPrisma.simulation.findUnique = jest.fn().mockResolvedValue({ userId: ownerId })
      mockPrisma.simulationCollaborator.findUnique = jest.fn().mockResolvedValue({ id: 'sc-1' })
      mockPrisma.simulationCollaborator.delete = jest.fn().mockResolvedValue({})
      mockSimulationsService.logActivity = jest.fn().mockResolvedValue(undefined)
    })

    it('should allow owner to remove any collaborator', async () => {
      await service.removeCollaborator(simulationId, ownerId, collaboratorId)

      expect(mockPrisma.simulationCollaborator.delete).toHaveBeenCalled()
      expect(mockEventsService.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'collaborator_left', userId: collaboratorId }))
    })

    it('should allow collaborator to remove themselves', async () => {
      await service.removeCollaborator(simulationId, collaboratorId, collaboratorId)

      expect(mockPrisma.simulationCollaborator.delete).toHaveBeenCalled()
    })

    it('should throw ForbiddenException when collaborator tries to remove another', async () => {
      await expect(service.removeCollaborator(simulationId, collaboratorId, 'other-user')).rejects.toThrow(ForbiddenException)
    })

    it('should throw NotFoundException when simulation not found', async () => {
      mockPrisma.simulation.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.removeCollaborator(simulationId, ownerId, collaboratorId)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when collaborator record not found', async () => {
      mockPrisma.simulationCollaborator.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.removeCollaborator(simulationId, ownerId, collaboratorId)).rejects.toThrow(NotFoundException)
    })
  })
})
