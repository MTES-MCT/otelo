import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TCreateEpciGroupDto, TEpciGroupWithEpcis, TPlanningDocumentType } from '~/schemas/epci-group'

/** Document désigné par l'utilisateur, à reporter sur le groupe. */
type PlanningDocument = {
  planningDocumentType?: TPlanningDocumentType | null
  planningDocumentName?: string | null
}

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

  /**
   * Enregistre que l'utilisateur élabore un document d'urbanisme sur ce territoire, et lequel.
   *
   * Sens unique : une réponse négative ultérieure ne doit pas effacer un « oui » déjà donné. Le type
   * et le nom, eux, suivent la dernière déclaration — l'utilisateur vient de nous la donner — mais ne
   * sont jamais remis à `null` par une simulation qui ne les porte pas.
   */
  async markWorksOnPlanningDocument(id: string, userId: string, document?: PlanningDocument): Promise<void> {
    await this.prisma.epciGroup.updateMany({
      where: { id, userId, deleted: null },
      data: {
        worksOnPlanningDocument: true,
        ...(document?.planningDocumentType && { planningDocumentType: document.planningDocumentType }),
        ...(document?.planningDocumentName && { planningDocumentName: document.planningDocumentName }),
      },
    })
  }

  async create(userId: string, data: TCreateEpciGroupDto): Promise<TEpciGroupWithEpcis> {
    const { name, epciCodes, worksOnPlanningDocument, planningDocumentType, planningDocumentName } = data

    return this.prisma.epciGroup.create({
      data: {
        name,
        userId,
        worksOnPlanningDocument: worksOnPlanningDocument ?? null,
        // Le document ne se conserve que s'il y en a un : « non » ne laisse aucune trace de type.
        planningDocumentType: worksOnPlanningDocument === true ? (planningDocumentType ?? null) : null,
        planningDocumentName: worksOnPlanningDocument === true ? (planningDocumentName ?? null) : null,
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
