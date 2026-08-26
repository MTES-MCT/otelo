import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'
import { Epci } from '~/generated/prisma/client'
import { TEpciContour } from '~/schemas/epcis/epci-contour'

@Injectable()
export class EpcisService {
  constructor(private readonly prisma: PrismaService) {}

  get(code: string): Promise<Epci> {
    return this.prisma.epci.findUniqueOrThrow({
      where: {
        code,
      },
    })
  }

  async getList(epcis: string, baseEpci?: string): Promise<Epci[]> {
    const epcisList = await this.prisma.epci.findMany({
      where: {
        code: { in: epcis.split(',') },
      },
    })

    if (baseEpci) {
      const baseEpciItem = epcisList.find((epci) => epci.code === baseEpci)
      const otherEpcis = epcisList.filter((epci) => epci.code !== baseEpci)

      return baseEpciItem ? [baseEpciItem, ...otherEpcis] : epcisList
    }

    return epcisList
  }

  create(data: TEpci): Promise<Epci> {
    return this.prisma.epci.create({
      data,
    })
  }

  put(code: string, data: Partial<Epci>): Promise<Epci> {
    return this.prisma.epci.update({
      data,
      where: { code },
    })
  }

  async getByBassin(bassinName: string): Promise<Epci[]> {
    return this.prisma.epci.findMany({
      where: {
        bassinName,
      },
    })
  }

  async getBassinEpcisByEpciCode(epciCode: string): Promise<Epci[]> {
    const epci = await this.get(epciCode)

    if (!epci.bassinName) {
      return []
    }

    const epcis = await this.prisma.epci.findMany({
      where: {
        bassinName: epci.bassinName,
      },
    })

    return [...epcis.filter((e) => e.code === epciCode), ...epcis.filter((e) => e.code !== epciCode)]
  }

  /**
   * Contours des EPCI demandés, pour la carte de la page de résultats. Les EPCI sans contour en base
   * sont simplement absents de la réponse : l'appelant masque la carte plutôt que d'échouer.
   */
  async getContours(epciCodes: string[]): Promise<TEpciContour[]> {
    const contours = await this.prisma.epciContour.findMany({
      where: { epciCode: { in: epciCodes } },
      select: { contour: true, epci: { select: { code: true, name: true } } },
    })

    return contours.map(({ contour, epci }) => ({
      code: epci.code,
      contour: contour as TEpciContour['contour'],
      nom: epci.name,
    }))
  }

  async getContiguousEpcis(epciCodes: string[]): Promise<Epci[]> {
    const contiguousEpcis = await this.prisma.ePCIContiguity.findMany({
      where: {
        epciCode: {
          in: epciCodes,
        },
      },
      include: {
        contiguousEpci: true,
      },
    })

    // Extract all contiguous EPCIs and remove duplicates
    const uniqueEpcis = new Map<string, Epci>()
    contiguousEpcis.forEach((contiguity) => {
      uniqueEpcis.set(contiguity.contiguousEpci.code, contiguity.contiguousEpci)
    })

    return Array.from(uniqueEpcis.values())
  }

  async delete(code: string): Promise<void> {
    await this.prisma.epci.delete({
      where: { code },
    })
  }
}
