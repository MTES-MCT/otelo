import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { anonymizeEmail } from '~/common/utils/email-anonymizer'
import { PrismaService } from '~/db/prisma.service'
import { Role } from '~/generated/prisma/enums'
import { TUser } from '~/schemas/users/user'

@Injectable()
export class ImpersonationService {
  private readonly logger = new Logger(ImpersonationService.name)

  constructor(private readonly prisma: PrismaService) {}

  async startImpersonation(adminUserId: string, targetUserId: string): Promise<void> {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    })

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can impersonate users')
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      throw new NotFoundException('Target user not found')
    }

    if (targetUser.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot impersonate another administrator')
    }

    if (targetUser.id === adminUserId) {
      throw new BadRequestException('Cannot impersonate yourself')
    }

    const existingImpersonation = await this.prisma.impersonationSession.findFirst({
      where: {
        adminUserId,
        isActive: true,
      },
    })

    if (existingImpersonation) {
      await this.stopImpersonation(adminUserId)
    }

    await this.prisma.impersonationSession.create({
      data: {
        adminUserId,
        targetUserId,
        isActive: true,
      },
    })

    await this.prisma.session.updateMany({
      where: { userId: adminUserId },
      data: { impersonatedUserId: targetUserId },
    })

    this.logger.log(
      `[AUDIT] Admin ${anonymizeEmail(admin.email)} (${admin.id}) started impersonating user ${anonymizeEmail(targetUser.email)} (${targetUser.id})`,
    )
  }

  async stopImpersonation(adminUserId: string): Promise<void> {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    })

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can stop impersonation')
    }

    const impersonationSession = await this.prisma.impersonationSession.findFirst({
      where: {
        adminUserId,
        isActive: true,
      },
      include: {
        targetUser: true,
      },
    })

    if (impersonationSession) {
      await this.prisma.impersonationSession.update({
        where: { id: impersonationSession.id },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      })

      await this.prisma.session.updateMany({
        where: { userId: adminUserId },
        data: { impersonatedUserId: null },
      })

      this.logger.log(
        `[AUDIT] Admin ${anonymizeEmail(admin.email)} (${admin.id}) stopped impersonating user ${anonymizeEmail(impersonationSession.targetUser.email)} (${impersonationSession.targetUser.id})`,
      )
    }
  }

  async getImpersonationStatus(adminUserId: string): Promise<{
    isImpersonating: boolean
    impersonatedUser?: Pick<TUser, 'id' | 'email' | 'firstname' | 'lastname'>
  }> {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    })

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can check impersonation status')
    }

    const impersonationSession = await this.prisma.impersonationSession.findFirst({
      where: {
        adminUserId,
        isActive: true,
      },
      include: {
        targetUser: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    })

    if (!impersonationSession) {
      return { isImpersonating: false }
    }

    return {
      isImpersonating: true,
      impersonatedUser: impersonationSession.targetUser,
    }
  }
}
