import { Injectable } from '@nestjs/common'
import { TEpciGeoData, TEpciNeighborsResponse } from '@shared'
import { PrismaService } from '~/db/prisma.service'
import { NeighborCategory } from '~/generated/prisma/client'

@Injectable()
export class EpciNeighborsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNeighborsByEpciCode(epciCode: string, category?: NeighborCategory): Promise<TEpciNeighborsResponse> {
    const neighbors = await this.prisma.ePCINeighbor.findMany({
      where: {
        epciCode,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { rank: 'asc' }],
      include: {
        neighborEpci: true,
      },
    })

    const allCodes = [epciCode, ...new Set(neighbors.map((n) => n.neighborEpciCode))]
    const geoResults = await Promise.all(allCodes.map((code) => this.fetchEpciGeo(code)))
    const geoMap = new Map<string, TEpciGeoData | null>(allCodes.map((code, i) => [code, geoResults[i]]))

    const epciGeo = geoMap.get(epciCode)
    if (!epciGeo) {
      throw new Error(`Could not fetch geo data for EPCI ${epciCode}`)
    }

    return {
      epci: epciGeo,
      neighbors: neighbors.map((n) => ({ ...n, geo: geoMap.get(n.neighborEpciCode) ?? null })),
    }
  }

  private async fetchEpciGeo(code: string): Promise<TEpciGeoData | null> {
    try {
      const res = await fetch(`https://geo.api.gouv.fr/epcis/${code}?fields=nom,code,centre,contour`)
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  }
}
