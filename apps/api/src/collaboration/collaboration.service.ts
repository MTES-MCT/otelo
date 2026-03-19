import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { SimulationEventsService } from '~/simulations/simulation-events.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'

@Injectable()
export class CollaborationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly simulationsService: SimulationsService,
    private readonly simulationEventsService: SimulationEventsService,
  ) {}

  async getActivityHistory(simulationId: string, limit = 50) {
    return this.prisma.simulationActivity.findMany({
      where: { simulationId },
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        user: { select: { id: true, firstname: true, lastname: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(Number.isFinite(limit) ? limit : 50, 1), 100),
    })
  }

  async listCollaborators(simulationId: string) {
    return this.prisma.simulationCollaborator.findMany({
      where: { simulationId },
      select: {
        id: true,
        createdAt: true,
        userId: true,
        user: { select: { id: true, email: true, firstname: true, lastname: true } },
        inviter: { select: { id: true, firstname: true, lastname: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async inviteByEmail(simulationId: string, invitedByUserId: string, email: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId, deleted: null },
      select: { userId: true },
    })

    if (!simulation) {
      throw new NotFoundException('Simulation not found')
    }

    // Only the owner can invite collaborators
    if (simulation.userId !== invitedByUserId) {
      throw new ForbiddenException('Seul le propriétaire peut inviter des collaborateurs')
    }

    const targetUser = await this.usersService.findByEmail(email)
    if (!targetUser) {
      throw new BadRequestException("Impossible d'inviter cet utilisateur. Vérifiez l'email ou demandez-lui de créer un compte.")
    }

    if (targetUser.id === simulation.userId) {
      throw new BadRequestException("Impossible d'inviter le propriétaire de la simulation")
    }

    // Check if already a collaborator
    const existing = await this.prisma.simulationCollaborator.findUnique({
      where: { simulationId_userId: { simulationId, userId: targetUser.id } },
    })
    if (existing) {
      throw new BadRequestException("Impossible d'inviter cet utilisateur. Vérifiez l'email ou demandez-lui de créer un compte.")
    }

    const collaborator = await this.prisma.simulationCollaborator.create({
      data: {
        simulationId,
        userId: targetUser.id,
        invitedBy: invitedByUserId,
      },
      select: {
        id: true,
        createdAt: true,
        userId: true,
        user: { select: { id: true, email: true, firstname: true, lastname: true } },
        inviter: { select: { id: true, firstname: true, lastname: true } },
      },
    })

    await this.simulationsService.logActivity(
      simulationId,
      invitedByUserId,
      'collaborator_invited',
      `${targetUser.firstname} ${targetUser.lastname} a été invité`,
    )

    this.simulationEventsService.emit({
      type: 'collaborator_joined',
      simulationId,
      userId: targetUser.id,
      clientId: '',
      timestamp: Date.now(),
    })

    return collaborator
  }

  async removeCollaborator(simulationId: string, requestingUserId: string, targetUserId: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId, deleted: null },
      select: { userId: true },
    })

    if (!simulation) {
      throw new NotFoundException('Simulation not found')
    }

    // Owner can remove anyone, collaborators can only remove themselves
    if (simulation.userId !== requestingUserId && requestingUserId !== targetUserId) {
      throw new ForbiddenException('Seul le propriétaire peut retirer un collaborateur')
    }

    const collaborator = await this.prisma.simulationCollaborator.findUnique({
      where: { simulationId_userId: { simulationId, userId: targetUserId } },
    })

    if (!collaborator) {
      throw new NotFoundException('Collaborateur non trouvé')
    }

    await this.prisma.simulationCollaborator.delete({
      where: { id: collaborator.id },
    })

    await this.simulationsService.logActivity(
      simulationId,
      requestingUserId,
      'collaborator_removed',
      requestingUserId === targetUserId ? 'A quitté la simulation' : 'Collaborateur retiré',
    )

    this.simulationEventsService.emit({
      type: 'collaborator_left',
      simulationId,
      userId: targetUserId,
      clientId: '',
      timestamp: Date.now(),
    })
  }
}
