import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TCreateEpciGroupDto, TEpciGroupWithEpcis } from '~/schemas/epci-group'

@Injectable()
export class EpciGroupsService {
  constructor(private prisma: PrismaService) {}

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prisma.epciGroup.findFirst({
      where: { id, userId, deleted: null },
    }))
  }

  async findAll(userId: string, withActiveSimulations?: boolean): Promise<TEpciGroupWithEpcis[]> {
    return this.prisma.epciGroup.findMany({
      where: {
        userId,
        deleted: null,
        ...(withActiveSimulations && {
          simulations: { some: { deleted: null } },
        }),
      },
      include: {
        epciGroupEpcis: {
          include: {
            epci: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(userId: string, data: TCreateEpciGroupDto): Promise<TEpciGroupWithEpcis> {
    const { name, epciCodes } = data

    return this.prisma.epciGroup.create({
      data: {
        name,
        userId,
        epciGroupEpcis: {
          create: epciCodes.map((epciCode) => ({
            epciCode,
          })),
        },
      },
      include: {
        epciGroupEpcis: {
          include: {
            epci: true,
          },
        },
      },
    })
  }
}
